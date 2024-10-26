import os
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.flask import SlackRequestHandler
from flask import Flask, request, redirect
from slack_sdk import WebClient

# 環境変数の読み込み
load_dotenv()

# Slack Bolt アプリの初期化
app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET")
)

# Flaskの初期化
flask_app = Flask(__name__)
handler = SlackRequestHandler(app)

# ユーザートークンを保存する辞書（実際はデータベースで管理推奨）
user_tokens = {}

# Botが送信するメッセージのBlock Kit JSON
block_kit_message = {
    "text": "リアクションを選んでください",
    "blocks": [
        {
            "type": "section",
            "block_id": "reactions_section",
            "text": {
                "type": "mrkdwn",
                "text": "リアクションをしましょう！:sparkles:"
            }
        },
        {
            "type": "actions",
            "block_id": "reactions_buttons",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":eye_hakushin:",
                        "emoji": True
                    },
                    "value": "eye_hakushin",
                    "action_id": "reaction1"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":sakurai:",
                        "emoji": True
                    },
                    "value": "sakurai",
                    "action_id": "reaction2"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":tokuniomae:",
                        "emoji": True
                    },
                    "value": "tokuniomae",
                    "action_id": "reaction3"
                }
            ]
        }
    ]
}

# ユーザーのメッセージにボタンを追加するイベントリスナー
@app.event("message")
def handle_message_events(body, client):
    # ユーザーから送信されたメッセージにボタンを含むメッセージを送信
    channel_id = body["event"]["channel"]
    message_ts = body["event"]["ts"]

    # ボタンのみのメッセージを送信（テキストを省略）
    client.chat_postMessage(
        channel=channel_id,
        blocks=[
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "リアクションを追加",
                            "emoji": True
                        },
                        "action_id": "open_reactions",
                        "value": message_ts  # メッセージのタイムスタンプをボタンに埋め込む
                    }
                ]
            }
        ]
    )

# 「リアクションを追加」ボタンが押されたときにBlock Kitメッセージを表示
@app.action("open_reactions")
def handle_open_reactions(ack, body, client):
    ack()

    # ボタンに埋め込んでいたタイムスタンプを取得
    message_ts = body["actions"][0]["value"]
    channel_id = body["channel"]["id"]

    # Botのリアクションメッセージを表示
    client.chat_postMessage(
        channel=channel_id,
        thread_ts=message_ts,  # ユーザーのメッセージのスレッドに表示
        blocks=block_kit_message["blocks"],
        text=block_kit_message["text"]
    )

# Slackのリクエストを処理するエンドポイント
@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)

# アプリの起動
if __name__ == "__main__":
    flask_app.run(port=int(os.environ.get("PORT", 3000)))
