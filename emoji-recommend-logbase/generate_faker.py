import pandas as pd
import os
from datetime import datetime, timezone
import random


def generate_random_timestamp(start_year=2023, end_year=2024):
    """
    指定された年の範囲内でランダムなUNIXタイムスタンプを生成する

    Args:
        start_year (int): 開始年（デフォルト: 2023年）
        end_year (int): 終了年（デフォルト: 2024年）

    Returns:
        str: "1234567890.123456" 形式のタイムスタンプ文字列
    """
    # 開始日時と終了日時をUNIXタイムスタンプに変換
    start_date = datetime(start_year, 1, 1, tzinfo=timezone.utc)
    end_date = datetime(end_year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

    start_ts = start_date.timestamp()
    end_ts = end_date.timestamp()

    # ランダムな整数部分を生成
    random_ts = random.uniform(start_ts, end_ts)

    # マイクロ秒部分をランダムに生成
    random_microseconds = random.random()

    # 最終的なタイムスタンプを生成
    final_timestamp = random_ts + random_microseconds

    # 指定された形式の文字列にフォーマット
    return f"{final_timestamp:.6f}"


# messages.csv の作成
messages_data = {
    "message_id": [f"M{i:03d}" for i in range(1, 11)],
    "message_text": [
        "プロジェクトが無事完了しました！皆様お疲れ様でした",
        "バグの修正が完了しましたのでレビューお願いします",
        "新機能の開発に着手しました。来週中には完了予定です",
        "明日の会議は13時からに変更となります",
        "テストの実行結果を共有します。すべてパスしました！",
        "休憩しましょう！お昼ご飯どこに行きますか？",
        "新しいチームメンバーの田中さんです。よろしくお願いします！",
        "デプロイが完了しました。動作確認お願いします",
        "みなさん、良い週末を！来週も頑張りましょう",
        "クライアントからフィードバックが届きました。とても良い評価でした",
    ],
    "message_user_id": [
        "U001",
        "U002",
        "U003",
        "U001",
        "U002",
        "U004",
        "U005",
        "U001",
        "U003",
        "U002",
    ],
    "channel_id": [
        "C001",
        "C002",
        "C002",
        "C001",
        "C002",
        "C003",
        "C001",
        "C002",
        "C001",
        "C001",
    ],
    "ts": [generate_random_timestamp() for _ in range(10)],
}

messages_df = pd.DataFrame(messages_data)

# reactions.csv の作成
reactions_data = {
    "reaction_id": [
        f"R{i:03d}" for i in range(1, 21)
    ],  # 各メッセージに複数のリアクション
    "message_id": [
        "M001",
        "M001",
        "M002",
        "M002",
        "M003",
        "M003",
        "M004",
        "M005",
        "M005",
        "M006",
        "M007",
        "M007",
        "M008",
        "M008",
        "M009",
        "M009",
        "M010",
        "M010",
        "M001",
        "M003",
    ],
    "reaction_user_id": [
        "U002",
        "U003",
        "U001",
        "U003",
        "U002",
        "U004",
        "U003",
        "U001",
        "U004",
        "U005",
        "U001",
        "U002",
        "U003",
        "U004",
        "U001",
        "U002",
        "U003",
        "U004",
        "U005",
        "U001",
    ],
    "emoji_id": [
        "E001",
        "E002",
        "E003",
        "E001",
        "E002",
        "E004",
        "E005",
        "E001",
        "E002",
        "E006",
        "E007",
        "E001",
        "E002",
        "E003",
        "E004",
        "E005",
        "E001",
        "E002",
        "E003",
        "E004",
    ],
    "ts": [generate_random_timestamp() for _ in range(20)],
}

reactions_df = pd.DataFrame(reactions_data)

# users.csv の作成
users_data = {
    "user_id": ["U001", "U002", "U003", "U004", "U005"],
    "user_name": ["佐藤", "鈴木", "田中", "高橋", "渡辺"],
    "total_point": [10, 9, 9, 5, 2],
}

users_df = pd.DataFrame(users_data)

# monthLog の生成
monthLog_data = {
    "user_id": ["U001", "U002", "U003", "U004", "U005"],
    "result_month": ["2024-09", "2024-09", "2024-09", "2024-09", "2024-09"],
    "month_total_point": [10, 9, 9, 5, 2],
    "reaction_1st_num": [15, 11, 10, 3, 0],
    "add_emoji_num": [1, 3, 0, 0, 0],
    "message_send_num": [5, 3, 2, 1, 0],
    "usage_emoji_num": [10, 8, 7, 2, 0],
}

monthLog_df = pd.DataFrame(monthLog_data)

# emojis.csv の作成
emojis_data = {
    "emoji_id": [f"E{i:03d}" for i in range(1, 11)],
    "emoji_name": [
        "tada",
        "clap",
        "heart",
        "eyes",
        "thumbsup",
        "pray",
        "rocket",
        "fire",
        "muscle",
        "sparkles",
    ],
    "label": [
        "完了 成功 おめでとう 達成 祝福",
        "拍手 すごい よくやった 称賛 感動",
        "感謝 愛 好き ありがとう うれしい",
        "注目 すばらしい 驚き 感動 興味",
        "賛成 いいね 了解 同意 承認",
        "お願い 祈り 感謝 期待 希望",
        "開始 スタート 発進 前進 進歩",
        "熱意 情熱 勢い やる気 熱心",
        "頑張る 力 強い 努力 根性",
        "きれい 素晴らしい 輝く 魅力 特別",
    ],
    "usage_num": [100, 95, 88, 82, 78, 72, 65, 60, 55, 50],
}

emojis_df = pd.DataFrame(emojis_data)

# CSVファイルとして保存

# processedディレクトリが存在しない場合は作成
os.makedirs("data/processed", exist_ok=True)

messages_df.to_csv("data/processed/messages.csv", index=False)
reactions_df.to_csv("data/processed/reactions.csv", index=False)
users_df.to_csv("data/processed/users.csv", index=False)
monthLog_df.to_csv("data/processed/month_log.csv", index=False)
emojis_df.to_csv("data/processed/emojis.csv", index=False)

# データの確認用出力
print("=== メッセージデータ ===")
print(messages_df.head(3))
print("\n=== リアクションデータ ===")
print(reactions_df.head(3))
print("\n=== ユーザーデータ ===")
print(users_df.head(3))
print("\n=== 月次ログデータ ===")
print(monthLog_df.head(3))
print("\n=== 絵文字データ ===")
print(emojis_df.head(3))
