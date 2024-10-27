# src/models/processor.py

from datetime import datetime
import pandas as pd
import numpy as np
from transformers import BertTokenizer, BertModel
import torch
import emoji
import re
from sklearn.preprocessing import LabelEncoder


class DataProcessor:
    def __init__(self, bert_tokenizer: BertTokenizer, bert_model: BertModel):
        """
        データ処理クラスの初期化
        
        Args:
            bert_tokenizer: 初期化済みのBERTトークナイザー
            bert_model: 初期化済みのBERTモデル
        """
        self.bert_tokenizer = bert_tokenizer
        self.bert_model = bert_model
        self.label_encoder = LabelEncoder()

    def _create_user_features(
        self, users_df: pd.DataFrame, reactions_df: pd.DataFrame
    ) -> pd.DataFrame:
        """ユーザー特徴量の作成"""
        # リアクション回数をカウント
        user_reaction_counts = reactions_df.groupby("reaction_user_id").size()

        # ユーザーデータとリアクションカウントをマージ
        user_features = users_df.set_index("user_id").copy()
        user_features["total_reactions"] = user_reaction_counts.reindex(
            user_features.index
        ).fillna(0).clip(lower=1)

        # ユーザー名をLabelエンコーディング
        user_features["user_name"] = self.label_encoder.fit_transform(
            user_features["user_name"]
        )

        # 新しいユーザーのために各特徴量のデフォルト値を記録
        self.user_feature_defaults = {
            col: 0 for col in user_features.columns
        }
        self.user_feature_defaults["total_reactions"] = 1  # デフォルトのリアクション数

        return user_features

    def preprocess_text(self, text: str) -> str:
        """テキストの前処理"""
        # URLの除去
        text = re.sub(r"http\S+|www.\S+", "", text)

        # 絵文字の抽出と置換
        for char in text:
            if char in emoji.EMOJI_DATA:
                text = text.replace(char, " EMJ ")

        # 特殊文字の除去
        text = re.sub(r"[^\w\s]", " ", text)

        return text.strip()

    def create_message_features(self, messages_df: pd.DataFrame) -> pd.DataFrame:
        """メッセージの特徴量抽出"""
        message_vectors = []
        for text in messages_df["message_text"]:
            # テキストの前処理
            text = self.preprocess_text(text)
            # BERTによる特徴量抽出
            inputs = self.bert_tokenizer(
                text, return_tensors="pt", padding=True, truncation=True, max_length=128
            )
            with torch.no_grad():
                outputs = self.bert_model(**inputs)
            message_vector = outputs.last_hidden_state.mean(dim=1).numpy()
            message_vectors.append(message_vector[0])

        feature_matrix = np.array(message_vectors)
        return pd.DataFrame(
            feature_matrix,
            columns=[f"bert_feature_{i:03d}" for i in range(feature_matrix.shape[1])]
        )

    def create_emoji_features(self, emojis_df: pd.DataFrame) -> pd.DataFrame:
        """絵文字の特徴量作成"""
        from sklearn.feature_extraction.text import CountVectorizer

        vectorizer = CountVectorizer()
        emojis_df["label"] = emojis_df["label"].fillna(emojis_df["emoji_name"])
        emoji_meanings = vectorizer.fit_transform(emojis_df["label"])

        emoji_features = pd.DataFrame(
            emoji_meanings.toarray(),
            index=emojis_df["emoji_id"],
            columns=vectorizer.get_feature_names_out()
        )
        
        emoji_features["usage_num"] = emojis_df.set_index("emoji_id")["usage_num"]
        
        return emoji_features

    def process_training_data(
        self, 
        messages_df: pd.DataFrame, 
        reactions_df: pd.DataFrame, 
        users_df: pd.DataFrame, 
        emojis_df: pd.DataFrame
    ) -> tuple[pd.DataFrame, pd.DataFrame]:
        """訓練データの作成"""
        print("ユーザー特徴量の作成中...")
        user_features = self._create_user_features(users_df, reactions_df)

        print("メッセージ特徴量の作成中...")
        message_features = self.create_message_features(messages_df)

        print("絵文字特徴量の作成中...")
        emoji_features = self.create_emoji_features(emojis_df)

        # messages_df["created_at"] = messages_df["created_at"].apply(lambda x: datetime.fromisoformat(x).timestamp())
        # messages_df["updated_at"] = messages_df["updated_at"].apply(lambda x: datetime.fromisoformat(x).timestamp())

        print("訓練データの結合中...")
        message_df = pd.concat([
            message_features,
            pd.DataFrame({
                'message_user_id': messages_df["message_user_id"],
                'message_id': messages_df["message_id"],
                # 'ts': messages_df["created_at"]
            })
        ], axis=1)

        # リアクションデータの準備
        reactions_with_emoji = reactions_df.merge(
            emojis_df[["emoji_id", "emoji_name"]], on="emoji_id"
        )

        # 訓練データの作成
        training_records = []
        for _, message in message_df.iterrows():
            message_reactions = reactions_with_emoji[
                reactions_with_emoji["message_id"] == message["message_id"]
            ]

            if len(message_reactions) > 0:
                user_feat = user_features.loc[message["message_user_id"]]
                message_feat = message.drop(["message_user_id", "message_id"])

                for _, reaction in message_reactions.iterrows():
                    record = pd.concat([
                        message_feat,
                        user_feat,
                        pd.Series({"target_emoji": reaction["emoji_name"]})
                    ])
                    training_records.append(record)

        training_data = pd.DataFrame(training_records)
        print(f"作成された訓練データ: {training_data.shape}")
        
        return training_data, emoji_features, user_features
    
    def predict(self, message_features: np.ndarray, top_k: int = 3):
        """
        メッセージの特徴量から絵文字を予測
        
        Args:
            message_features: BERTで抽出したメッセージの特徴量
            top_k: 返す予測の数
            
        Returns:
            List[dict]: 予測された絵文字と確率のリスト
        """
        if not self.model:
            raise ValueError("モデルが読み込まれていません")

        # 予測確率の取得
        probas = self.model.predict_proba(message_features.reshape(1, -1))

        # 上位k個の予測を取得
        top_indices = np.argsort(probas[0])[-top_k:][::-1]

        return [
            {
                "emoji": self.emoji_mapping[idx],
                "probability": float(probas[0][idx])
            }
            for idx in top_indices
        ]