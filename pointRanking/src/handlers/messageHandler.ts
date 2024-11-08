import { callAddFileSharePointsEdgeFunction } from "../edgeFunction/callAddFileSharePointEdgeFunction";
import { callAddKeywordPointsEdgeFunction } from "../edgeFunction/callAddKeywordPointsEdgeFunction";
import { callAddMentionPointsEdgeFunction } from "../edgeFunction/callAddMentionPointsEdgeFunction";
import { saveMessageData } from "../saveMessageData";

interface MessageEvent {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  event_ts: string;
  channel_type: string;
  files?: Array<{ id: string; name: string; url_private: string }>;
}

export const handleMessageEvent= async (
  event: any,
  client: any,
  serviceRoleKey: string
) => {
  const { user, ts, channel_type, files } = event;
  const messageId = ts;
  const messageUserId = user;
  const channelId = event.channel;

  // メッセージデータを保存
  const isMessageSaved = await saveMessageData({
    messageId,
    messageText: event.text,
    messageUserId,
    channelId,
  });

  if (!isMessageSaved) {
    console.error("メッセージの保存に失敗しました");
    return;
  }

  // チャンネルに投稿されたメッセージだけを処理
  if (channel_type === "channel") {
    try {
      const edgeKeywordResponse = await callAddKeywordPointsEdgeFunction(
        serviceRoleKey,
        messageId,
        messageUserId
      );
      const edgeMentionResponse = await callAddMentionPointsEdgeFunction(
        serviceRoleKey,
        messageId,
        messageUserId
      );
      console.log("Edge Function呼び出し成功:", edgeKeywordResponse);
      console.log(
        "Edge Function(addMentionPoints)の呼び出し成功",
        edgeMentionResponse
      );
      // ファイル共有のチェック
      if (files && files.length > 0) {
        const edgeFileShareResponse = await callAddFileSharePointsEdgeFunction(
          serviceRoleKey,
          messageId,
          messageUserId
        );
        console.log(
          "Edge Function(addFileSharePoints)の呼び出し成功",
          edgeFileShareResponse
        );
      }
    } catch (error) {
      console.error("メッセージチャンネルイベントエラー:", error);
    }
  }
};
