import type { WebClient } from "@slack/web-api";

export const fetchMessageInfo = async (
  client: WebClient,
  channelId: string,
  messageId: string
) => {
  try {
    // メッセージを取得
    const result = await client.conversations.history({
      channel: channelId,
      latest: messageId,
      inclusive: true, //タイムスタンプがlatestのメッセージを含む
      limit: 1, // 最新の1件のみ取得
    });

    // メッセージが取得できた場合
    if (result.messages && result.messages.length > 0) {
      const message = result.messages[0];
      return {
        messageUserId: message.user || "unknown_user",
        messageText: message.text || "unknown",
      };
    }
  } catch (error) {
    console.error("メッセージ取得", error);
  }

  return {
    messageUserId: "unknown_user",
    messageId: "unknown",
  };
};
