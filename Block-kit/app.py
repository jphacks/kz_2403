import os
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.flask import SlackRequestHandler
from flask import Flask, request
from slack_sdk import WebClient
from slack_bolt.authorization import AuthorizeResult

# 環境変数の読み込み
load_dotenv()

# Slack Bolt アプリの初期化
app = App(
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET"),
    authorize=lambda enterprise_id, team_id, *args, **kwargs: AuthorizeResult(
        enterprise_id=enterprise_id,
        team_id=team_id,
        bot_token=os.environ.get("SLACK_BOT_TOKEN")
    )
)

# Flaskの初期化
flask_app = Flask(__name__)
handler = SlackRequestHandler(app)

# ボタンメッセージのタイムスタンプを保持
bot_message_ts = None

# トップページのエンドポイント
@flask_app.route("/")
def home():
    return "Slack Bot Server is Running!"

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
    global bot_message_ts

    # ボットが自身のメッセージを編集した場合や、ボタンメッセージが既に存在する場合は無視
    if "bot_id" in body["event"] or bot_message_ts:
        return

    # ユーザーのメッセージにボタンを含むメッセージを送信
    channel_id = body["event"]["channel"]
    message_ts = body["event"]["ts"]

    # ボタンのみのメッセージを送信
    result = client.chat_postMessage(
        channel=channel_id,
        text="リアクションを追加できます。",
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
    # 新たなボタンメッセージのタイムスタンプを保存
    bot_message_ts = result["ts"]

# 「リアクションを追加」ボタンが押されたときにメッセージを更新
@app.action("open_reactions")
def handle_open_reactions(ack, body, client):
    global bot_message_ts
    ack()

    # チャンネルとボットメッセージのタイムスタンプを取得
    channel_id = body["channel"]["id"]

    # ボットのメッセージをリアクション選択メッセージに更新
    if bot_message_ts:
        client.chat_update(
            channel=channel_id,
            ts=bot_message_ts,
            blocks=block_kit_message["blocks"],
            text=block_kit_message["text"]
        )
        # メッセージ更新後、次のメッセージに対してボタンが表示されるようリセット
        bot_message_ts = None

# Slackのリクエストを処理するエンドポイント
@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)

# アプリの起動
if __name__ == "__main__":
    flask_app.run(port=int(os.environ.get("PORT", 3000)), debug=True)
