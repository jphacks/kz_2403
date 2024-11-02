import type { WebClient } from "@slack/web-api";

export const fetchMessageInfo = async (clinet: WebClient, channelId: string, messageId: string) => {
  try {
    const result = await clinet.conversations.history({
      channel: channelId,
      latest: messageId,
      inclusive: true,
      limit: 1,
    });

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
  }
}