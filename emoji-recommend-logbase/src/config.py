from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    アプリケーション設定
    """

    MODEL_PATH: str = "models/emoji_recommender.joblib"
    MAX_RECOMMENDATIONS: int = 3

    # データ関連
    DATA_DIR: str = "data"
    PROCESSED_DATA_DIR: str = str(Path("data") / "processed")
    ENABLE_CACHE: bool = True
    UPDATE_INTERVAL_HOURS: int = 24

    # Supabase設定
    SUPABASE_URL: str
    SUPABASE_KEY: str

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    設定インスタンスを取得（キャッシュ付き）
    """
    return Settings()


def get_data_manager():
    """
    DataManagerインスタンスを取得
    """
    settings = get_settings()
    from data.manager import DataManager
    return DataManager(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_KEY,
        data_dir=settings.PROCESSED_DATA_DIR,
        update_interval_hours=settings.UPDATE_INTERVAL_HOURS
    )
