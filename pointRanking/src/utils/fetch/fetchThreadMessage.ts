import { WebClient } from "@slack/web-api";

export const fetchThreadMessages = async (
  client: WebClient,
  channelId: string,
  threadTs: string
): Promise<string[]> => {
  try {
    const result = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
    });

    if (result.messages) {
      return result.messages.map((message) => message.text || "");
    }
  } catch (error) {
    console.error("スレッドメッセージの取得エラー:", error);
  }

  return [];
};
