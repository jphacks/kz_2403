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

# タイムスタンプを保存する変数
previous_ts = None
recommended_ts = None

# Block KitのJSON（例）
block_kit_message = {
    "text": "リアクションを選んでください",  # 通知やスクリーンリーダー用のtextフィールド
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
                    "value": "eye_hakushin",  # 実際の絵文字の名前を指定
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

# Botが送信する前のメッセージにリアクションを追加する
@app.event("message")
def handle_message_events(body, say):
    global previous_ts, recommended_ts

    # 最新メッセージのタイムスタンプを保存し、Block Kitメッセージを送信
    previous_ts = body["event"]["ts"]
    result = say(block_kit_message)
    recommended_ts = result["ts"]

# ボタンが押されたときにリアクションを追加するアクションリスナー
@app.action("reaction1")
@app.action("reaction2")
@app.action("reaction3")
def handle_reaction_buttons(ack, body, client):
    global previous_ts

    ack()  # ボタンのアクションを即座に確認

    # ボタンのvalueに応じたリアクション名を取得
    reaction_name = body["actions"][0]["value"]

    # ボットメッセージの前のメッセージのチャンネルIDとタイムスタンプを取得
    channel_id = body["channel"]["id"]
    
    # ボタンを押したユーザーのIDを取得
    user_id = body["user"]["id"]

    # ユーザーとしてリアクションを追加（Slack APIではボットでなく、ユーザー認証トークンが必要）
    if previous_ts:
        try:
            # APIの呼び出しでリアクションを追加
            client.api_call(
                api_method="reactions.add",
                json={
                    "channel": channel_id,
                    "timestamp": previous_ts,
                    "name": reaction_name,
                    "user": user_id
                }
            )
        except Exception as e:
            print(f"リアクション追加中のエラー: {e}")

# 「おすすめを非表示」ボタンを押したときにおすすめメッセージを削除
@app.action("hide_reactions")
def hide_reactions(ack, body, client):
    global recommended_ts

    ack()  # ボタンのアクションを即座に確認

    # チャンネルIDとおすすめメッセージのタイムスタンプを取得
    channel_id = body["channel"]["id"]

    # Slack APIを使っておすすめメッセージを削除
    if recommended_ts:
        client.chat_delete(
            channel=channel_id,
            ts=recommended_ts
        )

# Slackのリクエストを処理するエンドポイント
@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)

# アプリの起動
if __name__ == "__main__":
    flask_app.run(port=int(os.environ.get("PORT", 3000)))
