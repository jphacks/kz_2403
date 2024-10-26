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

// メッセージの履歴を保持するための構造
interface MessageHistory {
  channelId: string;
  userMessageTs: string;
  botMessageTs: string;
}

// チャンネルごとのメッセージ履歴を保持
const channelMessageHistory = new Map<string, MessageHistory>();

// メッセージを返信する関数
async function sendReply(context: any, channelId: string, userMessage: string) {
  try {
    await context.client.chat.postMessage({
      channel: channelId,
      text: `あなたが送ったメッセージ: "${userMessage}"`,
      blocks: createMessageBlocks(),
    });
    console.log("Message sent successfully.");
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

// メッセージブロックを作成する関数
function createMessageBlocks() {
  return [
    {
      type: "section",
      block_id: "reactions_section",
      text: {
        type: "mrkdwn",
        text: "おすすめのリアクションはこちら:sparkles:",
      },
    },
    {
      type: "actions",
      block_id: "reactions_buttons",
      elements: createReactionButtons(),
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "おすすめを非表示",
            emoji: true,
          },
          action_id: "hide_reactions",
          value: "hide",
        },
      ],
    },
  ];
}

// リアクションボタンを作成する関数
function createReactionButtons() {
  const reactionButtons = [
    ":justdoit_1:",
    ":tokuniomae:",
    ":ningen_is_oroka:",
    ":ultrafastparrot:",
  ];
  return reactionButtons.map((emoji, index) => ({
    type: "button",
    text: {
      type: "plain_text",
      text: emoji,
      emoji: true,
    },
    action_id: `reaction_${index + 1}`,
    value: emoji.replace(/:/g, ""), // コロンを取り除いてvalueに設定
  }));
}

// メッセージイベントを処理
app.event("message", async ({ body, context }) => {
  const event = body.event;

  // ボット自身のメッセージを検出して履歴を更新
  if (event.subtype === "bot_message") {
    updateBotMessageHistory(event);
    return;
  }

  // ユーザーメッセージの処理
  const userMessage = event?.text;

  if (userMessage) {
    console.log(`Received message: ${userMessage}`);
    console.log(`Sending reply to channel: ${event.channel}`);

    // チャンネル履歴を更新
    channelMessageHistory.set(event.channel, {
      channelId: event.channel,
      userMessageTs: event.ts,
      botMessageTs: "", // ボットの返信後に更新される
    });

    await sendReply(context, event.channel, userMessage);
  } else {
    console.log("Received event was not a text message.");
  }
});

// ボットメッセージの履歴を更新する関数
function updateBotMessageHistory(event: any) {
  const channelHistory = channelMessageHistory.get(event.channel);
  if (channelHistory) {
    channelHistory.botMessageTs = event.ts;
    channelMessageHistory.set(event.channel, channelHistory);
  }
  console.log("Bot message detected and history updated.");
}

// 各リアクションボタンのアクションハンドラー
const reactionActionIds = ["reaction_1", "reaction_2", "reaction_3", "reaction_4"];
reactionActionIds.forEach((actionId) => {
  app.action(actionId, async ({ body, context }) => {
    const channelId = body.channel?.id;
    const messageTs = body.message?.ts;
    const actionValue = body.actions?.[0]?.value;

    console.log(`Action triggered: ${actionId}, Channel: ${channelId}, Value: ${actionValue}`);

    await addReaction(context, channelId, messageTs, actionValue);
  });
});

// リアクションを追加する関数
async function addReaction(context: any, channelId: string | undefined, messageTs: string | undefined, actionValue: string | undefined) {
  if (!channelId || !messageTs || !actionValue) return;

  try {
    // 直前のメッセージタイムスタンプを取得
    const history = await context.client.conversations.history({
      channel: channelId,
      latest: messageTs,
      limit: 2, // ボットのメッセージと直前のメッセージを取得
      inclusive: true,
    });

    // 直前のユーザーメッセージを探す
    const userMessage = history.messages?.find((msg: { bot_id?: string; ts: string }) => !msg.bot_id);

    if (userMessage) {
      await context.client.reactions.add({
        channel: channelId,
        name: actionValue,
        timestamp: userMessage.ts,
      });
      console.log(`Added reaction "${actionValue}" to message ${userMessage.ts}`);
    }
  } catch (error) {
    console.error("Error handling reaction:", error);
  }
};

// 非表示ボタンのアクションハンドラー
app.action("hide_reactions", async ({ body }) => {
  const responseUrl = body.response_url;
  if (responseUrl) {
    try {
      await fetch(responseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replace_original: true,
          text: body.message?.text || "メッセージは非表示にされました",
          blocks: [], // ブロックを空にして非表示にする
        }),
      });
    } catch (error) {
      console.error("Failed to hide reactions:", error);
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
