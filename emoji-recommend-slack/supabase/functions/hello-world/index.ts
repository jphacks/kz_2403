import {
  SlackApp,
  SlackEdgeAppEnv,
} from "https://deno.land/x/slack_edge@1.2.1/mod.ts";

// Slackアプリケーションのインスタンスを作成
const app = new SlackApp<SlackEdgeAppEnv>({
  env: {
    SLACK_SIGNING_SECRET: Deno.env.get("SLACK_SIGNING_SECRET")!,
    SLACK_BOT_TOKEN: Deno.env.get("SLACK_BOT_TOKEN"),
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

// メッセージイベントを処理
app.event("message", async ({ body, context }) => {
  const event = body.event;

  // ボットのメッセージを除外
  if (event.subtype === "bot_message") {
    return;
  }

  const channelId = event.channel;
  const messageTs = event.ts;
  const messageText = event.text; // メッセージのテキスト

  if (channelId && messageTs) {
    try {
      // APIリクエストのためのデータ
      const requestBody = {
        id: messageTs, // メッセージのID
        text: messageText, // 投稿内容
      };

      // APIを叩いてリアクションを取得
      const response = await fetch("EMOJI_API_URL", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const recommendedReactions = data.recommendReactions.map((reaction: { emoji: string }) => reaction.emoji);

      // おすすめのリアクションを追加
      for (const reaction of recommendedReactions) {
        await context.client.reactions.add({
          channel: channelId,
          name: reaction,
          timestamp: messageTs,
        });
        console.log(`Added reaction "${reaction}" to message ${messageTs}`);
      }
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  }
});

// Denoサーバーを起動
Deno.serve(async (req) => {
  try {
    return await app.run(req);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
