# src/models/recommender.py

from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pandas as pd
import joblib


class EmojiRecommender:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=33)
        self.user_features = None
        self.emoji_features = None
        self.emoji_mapping = None
        self.feature_columns = None
        self.user_feature_defaults = None

    def get_user_features(self, user_id: str) -> np.ndarray:
        """ユーザー特徴量の取得（存在しない場合はデフォルト値を使用）"""
        if user_id in self.user_features.index:
            return self.user_features.loc[user_id].values
        else:
            # デフォルト値を持つSeriesを作成
            default_features = pd.Series(self.user_feature_defaults)
            print(f"警告: ユーザー {user_id} の特徴量が見つかりません。デフォルト値を使用します。")
            return default_features.values

    def train(self, training_data: pd.DataFrame, user_features: pd.DataFrame):
        """モデルの学習"""
        if training_data is None:
            raise ValueError("学習データが提供されていません")

        # 特徴量とターゲットを分離
        X = training_data.drop("target_emoji", axis=1)
        y = training_data["target_emoji"]

        # 特徴量の列名と各種データを保存
        self.feature_columns = X.columns.tolist()
        self.user_features = user_features
        
        # user_feature_defaultsの設定
        self.user_feature_defaults = {
            col: 0 for col in user_features.columns
        }
        self.user_feature_defaults.update({
            "total_reactions": 1,
            "user_name_encoded": -1
        })

        # 絵文字マッピングの作成
        unique_emojis = y.unique()
        self.emoji_mapping = dict(enumerate(unique_emojis))

        # モデルの学習
        print("モデルの学習を開始...")
        print(f"特徴量の次元数: {X.shape[1]}")
        print(f"訓練データのサンプル数: {X.shape[0]}")
        self.model.fit(X, y)
        print("学習完了")

    def predict(self, features: np.ndarray, top_k: int = 3) -> list:
        """新しいメッセージに対する絵文字の予測"""
        if self.model is None:
            raise ValueError("モデルが学習されていません。")

        if self.emoji_mapping is None:
            raise ValueError("絵文字マッピングが初期化されていません。")

        # 予測確率の取得
        probas = self.model.predict_proba(features.reshape(1, -1))

        # 上位k個の予測を取得
        top_indices = np.argsort(probas[0])[-top_k:][::-1]

        predictions = [
            {
                "emoji": self.emoji_mapping[idx],
                "probability": float(probas[0][idx])
            }
            for idx in top_indices
        ]

        return predictions

    def save(self, path: str):
        """モデルと必要な情報を保存"""
        if not self.model or not self.emoji_mapping:
            raise ValueError("モデルが学習されていません。save()の前にtrain()を実行してください。")

        # 保存前の確認
        if self.user_features is None:
            raise ValueError("ユーザー特徴量が設定されていません")
        
        if self.user_feature_defaults is None:
            raise ValueError("ユーザー特徴量のデフォルト値が設定されていません")
        
        model_data = {
            "model": self.model,
            "emoji_mapping": self.emoji_mapping,
            "feature_columns": self.feature_columns,
            "user_features": self.user_features,
            "user_feature_defaults": self.user_feature_defaults
        }

        joblib.dump(model_data, path)
        print(f"モデルを保存しました: {path}")
        print(f"User features shape: {self.user_features.shape}")
        print(f"Feature columns: {len(self.feature_columns)}")
        print(f"Default features: {self.user_feature_defaults}")

    @classmethod
    def load(cls, path: str):
        """保存されたモデルと情報を読み込み"""
        print(f"モデルを読み込み中: {path}")
        data = joblib.load(path)
        
        instance = cls()
        instance.model = data["model"]
        instance.emoji_mapping = data["emoji_mapping"]
        instance.feature_columns = data["feature_columns"]
        instance.user_features = data["user_features"]
        instance.user_feature_defaults = data["user_feature_defaults"]
        
        print("モデルの読み込みが完了しました")
        print(f"User features shape: {instance.user_features.shape}")
        print(f"Feature columns: {len(instance.feature_columns)}")
        print(f"Default features: {instance.user_feature_defaults}")
        return instance