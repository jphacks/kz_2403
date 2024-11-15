import { callAddFileSharePointsEdgeFunction } from "../../edgeFunction";
import { callAddKeywordPointsEdgeFunction } from "../../edgeFunction";
import { callAddMentionPointsEdgeFunction } from "../../edgeFunction";
import { saveMessage } from "../../saveData";
import { fetchUserInfo } from "../../utils";
import { WebClient } from "@slack/web-api";

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

export const handleMessageEvent = async (
  event: any,
  serviceRoleKey: string,
  workspaceId: string,
  client: WebClient
) => {
  const { user, ts, channel_type, files } = event;
  const messageId = ts;
  const messageUserId = user;
  const channelId = event.channel;

  // ユーザー名を取得
  const userName = await fetchUserInfo(client, messageUserId);

  // メッセージデータを保存
  const isMessageSaved = await saveMessage({
    messageId,
    workspaceId,
    messageText: event.text,
    userId: messageUserId,
    userName,
    channelId,
  });

  if (!isMessageSaved) {
    console.error("メッセージの保存に失敗しました");
    return;
  }

  // チャンネルに投稿されたメッセージだけを処理
  if (channel_type === "channel") {
    try {
      // Edge Function（キーワードポイント）を呼び出し
      console.log("callAddKeywordPointsEdgeFunctionを呼び出します");
      const edgeKeywordResponse = await callAddKeywordPointsEdgeFunction(
        serviceRoleKey,
        messageId,
        messageUserId,
      );
      console.log("Edge Function（キーワードポイント）の呼び出し成功:", edgeKeywordResponse);

      console.log("callAddMentionPointsEdgeFunctionを呼び出します");
      const edgeMentionResponse = await callAddMentionPointsEdgeFunction(
        serviceRoleKey,
        messageId,
        messageUserId,
      );
      console.log("Edge Function（メンションポイント）の呼び出し成功:", edgeMentionResponse);

      // ファイル共有のチェック
      if (files && files.length > 0) {
        console.log("callAddFileSharePointsEdgeFunctionを呼び出します");
        const edgeFileShareResponse = await callAddFileSharePointsEdgeFunction(
          serviceRoleKey,
          messageId,
          messageUserId,
        );
        console.log(
          "Edge Function（ファイル共有ポイント）の呼び出し成功:",
          edgeFileShareResponse,
        );
      }
    } catch (error) {
      console.error("メッセージチャンネルイベントエラー:", error);
    }
  }
};