# scripts/train_model.py

from data.manager import DataManager
from models.processor import DataProcessor
from models.recommender import EmojiRecommender
from config import get_data_manager, get_settings
from transformers import BertTokenizer, BertModel

def main():
    settings = get_settings()
    data_manager = get_data_manager()
    
    # データの取得
    print("データの読み込み中...")
    data = data_manager.get_data()
    
    print(f"データ読み込み完了:")
    print(f"- メッセージ: {len(data['messages'])}件")
    print(f"- リアクション: {len(data['reactions'])}件")
    print(f"- ユーザー: {len(data['users'])}件")
    print(f"- 絵文字: {len(data['emojis'])}件")

    # BERTモデルの初期化（1回だけ）
    print("BERTモデルの初期化...")
    bert_tokenizer = BertTokenizer.from_pretrained("cl-tohoku/bert-base-japanese")
    bert_model = BertModel.from_pretrained("cl-tohoku/bert-base-japanese")

    # データ処理とモデルの学習
    processor = DataProcessor(bert_tokenizer, bert_model)
    training_data, emoji_features, user_features = processor.process_training_data(
        messages_df=data['messages'],
        reactions_df=data['reactions'],
        users_df=data['users'],
        emojis_df=data['emojis']
    )

    # モデルの学習
    recommender = EmojiRecommender()
    recommender.train(training_data, user_features)
    recommender.save(settings.MODEL_PATH)

if __name__ == "__main__":
    main()