import {
  SlackApp,
  SlackEdgeAppEnv,
} from "https://deno.land/x/slack_edge@1.2.1/mod.ts";

// Slackアプリケーションのインスタンスを作成
const app = new SlackApp<SlackEdgeAppEnv>({
  env: {
    SLACK_SIGNING_SECRET: Deno.env.get("SLACK_SIGNING_SECRET")!, // Slackの署名シークレットを取得
    SLACK_BOT_TOKEN: Deno.env.get("SLACK_BOT_TOKEN"), // Slackのボットトークンを取得
    SLACK_LOGGING_LEVEL: "DEBUG", // ロギングレベルをDEBUGに設定
  },
});


// メッセージイベントを処理
app.event("message", async ({ body, context }) => {
  const event = body.event; // 型アサーションを使用してイベントを扱う

  // イベント情報のログを出力
  console.log("Received message event:", event);

  // ボット自身のメッセージを無視する
  if (event.subtype === "bot_message") {
    console.log("Bot message detected, ignoring.");
    return;
  }

  // ユーザーの送信したメッセージを取得
  const userMessage = event?.text;

  // メッセージが存在する場合に鸚鵡返しを行う
  if (userMessage) {
    console.log(`Received message: ${userMessage}`);
    console.log(`Sending reply to channel: ${event.channel}`);

    try {
      // メッセージを返信
      await context.client.chat.postMessage({
        channel: event.channel, // 送信元のチャンネルID
        text: `あなたが送ったメッセージ: "${userMessage}"`, // textは絶対に含めないとダメらしい
        blocks: [
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
                  "emoji": true
                },
                "value": "thumbs_up"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": ":tokuniomae:",
                  "emoji": true
                },
                "value": "heart"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": ":ningen_is_oroka:",
                  "emoji": true
                },
                "value": "heart"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": ":ultrafastparrot:",
                  "emoji": true
                },
                "value": "clap"
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
                  "emoji": true
                },
                "action_id": "hide_reactions",
                "value": "hide"
              }
            ]
          }
        ]
      });
      console.log("Message sent successfully.");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  } else {
    console.log("Received event was not a text message.");
  }
});

// Denoサーバーを起動
Deno.serve(async (req) => {
  try {
    // アプリケーションを実行し、リクエストを処理
    return await app.run(req);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
