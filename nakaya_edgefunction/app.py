import os
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.flask import SlackRequestHandler
from flask import Flask, request

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

# Block KitのJSON（例）
block_kit_message = {
    "text": "おすすめのリアクションを選んでください",  # 通知やスクリーンリーダー用のtextフィールド
    "blocks": [
        {
            "type": "section",
            "block_id": "reactions_section",
            "text": {
                "type": "mrkdwn",
                "text": "おすすめのリアクションはこちら:sparkles:"
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
                        "text": ":justdoit_1:",
                        "emoji": True
                    },
                    "value": "reaction_1"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":tokuniomae:",
                        "emoji": True
                    },
                    "value": "reaction_2"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":ningen_is_oroka:",
                        "emoji": True
                    },
                    "value": "reaction_3"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":ultrafastparrot:",
                        "emoji": True
                    },
                    "value": "reaction_4"
                }
            ]
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "おすすめを非表示",
                        "emoji": True
                    },
                    "action_id": "hide_reactions",
                    "value": "hide"
                }
            ]
        }
    ]
}

# 誰かがメッセージを投稿したときの応答にBlock Kitを使う（全てのユーザーに個別に表示）
@app.event("message")
def handle_message_events(body, client):
    # メッセージを投稿したチャンネルIDを取得
    channel_id = body["event"]["channel"]
    
    # チャンネル内の全メンバーを取得
    result = client.conversations_members(channel=channel_id)
    members = result.get("members", [])
    
    # 各メンバーに個別にBlock Kitメッセージを送信
    for user_id in members:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            blocks=block_kit_message["blocks"],
            text=block_kit_message["text"]  # 必須フィールド
        )

# Slackのリクエストを処理するエンドポイント
@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)

# アプリの起動
if __name__ == "__main__":
    flask_app.run(port=int(os.environ.get("PORT", 3000)))