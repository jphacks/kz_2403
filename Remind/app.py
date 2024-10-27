import os
import time
import threading
import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from slack_sdk.socket_mode import SocketModeClient
from slack_sdk.socket_mode.request import SocketModeRequest
from slack_sdk.socket_mode.response import SocketModeResponse
from dotenv import load_dotenv

# .envファイルの読み込み
load_dotenv()

# トークンの取得
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
SLACK_APP_TOKEN = os.getenv("SLACK_APP_TOKEN")

# ロギングの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# クライアントの初期化
client = WebClient(token=SLACK_BOT_TOKEN)
socket_client = SocketModeClient(app_token=SLACK_APP_TOKEN, web_client=client)

# BotのユーザーIDを取得
bot_user_id = client.auth_test()["user_id"]
team_id = client.auth_test()["team_id"]
logging.info(f"BotのユーザーID: {bot_user_id}")  # BotユーザーIDを確認

# タイマーを管理するための辞書
timers = {}

# メンションを検出してリマインドをセットする関数
def handle_event(event_data):
    event = event_data["event"]
    logging.info(f"受信イベントデータ: {event}")  # イベント内容を確認

    # メッセージイベントの条件とメンションされたユーザーの確認
    if event.get("type") == "message" and f"<@{bot_user_id}>" not in event.get("text", ""):
        # メッセージ内のメンションされたユーザーIDを抽出
        mentioned_users = [element["user_id"] for block in event.get("blocks", [])
                           for element in block.get("elements", [])
                           if element["type"] == "rich_text_section"
                           for element in element.get("elements", [])
                           if element["type"] == "user"]

        if mentioned_users:
            mentioned_user_id = mentioned_users[0]  # 最初のメンションユーザーにリマインド
            channel_id = event["channel"]
            ts = event["ts"]
            logging.info(f"メンションを検出しました: メンション対象ユーザーID={mentioned_user_id}, チャンネルID={channel_id}, タイムスタンプ={ts}")

            # リマインドタイマーをセット
            set_reminder_timer(channel_id, ts, mentioned_user_id)
    else:
        logging.info("メンション条件に一致しませんでした。")  # メンションに一致しない場合のログ

def set_reminder_timer(channel_id, ts, mentioned_user_id):
    # タイマーを設定してリマインドを繰り返す
    timer = threading.Timer(20, check_response, args=(channel_id, ts, mentioned_user_id))
    timer.start()

    # タイマーを管理用辞書に保存
    timers[(channel_id, ts)] = timer

def check_response(channel_id, ts, mentioned_user_id):
    # タイマーがキャンセルされている場合はリマインドを送らない
    if (channel_id, ts) not in timers:
        logging.info("返信またはリアクションが確認され、リマインドはキャンセルされました。")
        return

    try:
        # メッセージスレッドの返信をチェック
        replies = client.conversations_replies(channel=channel_id, ts=ts)["messages"]
        if any(reply["user"] == mentioned_user_id for reply in replies[1:]):  # 最初のメッセージは元の投稿
            logging.info("返信が確認されました。リマインドは不要です。")
            cancel_timer(channel_id, ts)
            return  # 返信があればリマインド不要

        # リアクションのチェック
        reactions = client.reactions_get(channel=channel_id, timestamp=ts)["message"].get("reactions", [])
        if any(mentioned_user_id in reaction.get("users", []) for reaction in reactions):
            logging.info("リアクションが確認されました。リマインドは不要です。")
            cancel_timer(channel_id, ts)
            return  # リアクションがあればリマインド不要

        # リマインドメッセージをDMとして送信
        logging.info("リマインドを送信しています...")

        # DMのチャンネルIDを取得
        dm_channel = client.conversations_open(users=mentioned_user_id)["channel"]["id"]

        # 内部リンクを生成
        internal_link = f"slack://channel?team={team_id}&id={channel_id}&message={ts}"

        # DMにリマインドメッセージとリンクを送信
        client.chat_postMessage(
            channel=dm_channel, 
            text=f"こちらの [メッセージ]({internal_link}) に返信またはリアクションがありません。ご確認ください！"
        )
        logging.info(f"リマインドをDMで送信しました: メンション対象ユーザーID={mentioned_user_id}")
        
        # 再度リマインドタイマーをセット
        set_reminder_timer(channel_id, ts, mentioned_user_id)
        
    except SlackApiError as e:
        logging.error(f"リマインドの送信エラー: {e.response['error']}")

# タイマーをキャンセルする関数
def cancel_timer(channel_id, ts):
    if (channel_id, ts) in timers:
        timers[(channel_id, ts)].cancel()
        del timers[(channel_id, ts)]

# イベントハンドラーの設定
def process(client, socket_mode_request: SocketModeRequest):
    if socket_mode_request.type == "events_api":
        logging.info("イベントを受信しました。")
        client.send_socket_mode_response(SocketModeResponse(envelope_id=socket_mode_request.envelope_id))
        logging.info("イベント送信成功")
        handle_event(socket_mode_request.payload)

# ソケットモードのイベントリスナーの設定
socket_client.socket_mode_request_listeners.append(process)

# ボットの起動
if __name__ == "__main__":
    socket_client.connect()
    logging.info("Bot is running...")
    while True:
        time.sleep(1)  # Botが停止しないようにする
