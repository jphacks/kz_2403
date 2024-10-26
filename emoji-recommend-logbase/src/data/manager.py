# src/data/manager.py

from datetime import datetime
import pandas as pd
from supabase import create_client, Client
from pathlib import Path
import json


class DataManager:
    def __init__(
        self, 
        supabase_url: str, 
        supabase_key: str,
        data_dir: str = "data/processed",
        update_interval_hours: int = 24
    ):
        """
        データ管理クラスの初期化
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_path = self.data_dir / "metadata.json"
        self.update_interval_hours = update_interval_hours

    def _fetch_from_supabase(self) -> dict:
        """
        Supabaseから最新のデータを取得
        """
        messages = self.supabase.table("Message").select("*").execute()
        reactions = self.supabase.table("Reaction").select("*").execute()
        users = self.supabase.table("User").select("*").execute()
        month_log = self.supabase.table("MonthLog").select("*").execute()
        emojis = self.supabase.table("Emoji").select("*").execute()

        return {
            "messages": pd.DataFrame(messages.data),
            "reactions": pd.DataFrame(reactions.data),
            "users": pd.DataFrame(users.data),
            "month_log": pd.DataFrame(month_log.data),
            "emojis": pd.DataFrame(emojis.data),
        }

    def _save_to_csv(self, data: dict):
        """
        データをCSVとして保存
        """
        for name, df in data.items():
            df.to_csv(self.data_dir / f"{name}.csv", index=False)

        # メタデータの保存
        metadata = {
            "last_updated": datetime.now().isoformat(),
            "record_counts": {name: len(df) for name, df in data.items()},
        }
        with open(self.metadata_path, "w") as f:
            json.dump(metadata, f)

    def _load_from_csv(self) -> dict:
        """
        CSVからデータを読み込み
        """
        print("CSVからデータを読み込み中...")
        data = {}
        for file_name in [
            "messages.csv",
            "reactions.csv",
            "users.csv",
            "month_log.csv",
            "emojis.csv",
        ]:
            path = self.data_dir / file_name
            if path.exists():
                data[file_name.replace(".csv", "")] = pd.read_csv(path)
        return data

    def needs_update(self, update_interval_hours: int = 24) -> bool:
        """
        データの更新が必要かどうかを判定
        """
        if not self.metadata_path.exists():
            return True

        with open(self.metadata_path, "r") as f:
            metadata = json.load(f)

        last_updated = datetime.fromisoformat(metadata["last_updated"])
        hours_since_update = (datetime.now() - last_updated).total_seconds() / 3600

        return hours_since_update >= update_interval_hours

    def get_data(self, force_update: bool = False) -> dict:
        """
        最新のデータを取得
        """
        if force_update or self.needs_update():
            print("Supabaseから最新データを取得中...")
            data = self._fetch_from_supabase()
            self._save_to_csv(data)
            print("データを更新しました")
        else:
            print("キャッシュされたデータを使用")
            data = self._load_from_csv()

        return data
