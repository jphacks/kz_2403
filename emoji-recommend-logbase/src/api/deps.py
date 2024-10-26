from transformers import BertTokenizer, BertModel
from models.processor import DataProcessor
from models.recommender import EmojiRecommender
from functools import lru_cache
from config import get_settings

@lru_cache()
def get_bert_models():
    """BERTモデルのシングルトンインスタンスを取得"""
    tokenizer = BertTokenizer.from_pretrained("cl-tohoku/bert-base-japanese")
    model = BertModel.from_pretrained("cl-tohoku/bert-base-japanese")
    return tokenizer, model

@lru_cache()
def get_processor():
    """DataProcessorのシングルトンインスタンスを取得"""
    tokenizer, model = get_bert_models()
    return DataProcessor(tokenizer, model)

@lru_cache()
def get_recommender():
    """EmojiRecommenderのシングルトンインスタンスを取得"""
    settings = get_settings()
    return EmojiRecommender.load(settings.MODEL_PATH)