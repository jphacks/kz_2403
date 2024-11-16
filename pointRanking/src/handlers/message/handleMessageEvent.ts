import { callAddFileSharePointsEdgeFunction } from "../../edgeFunction";
import { callAddKeywordPointsEdgeFunction } from "../../edgeFunction";
import { callAddMentionPointsEdgeFunction } from "../../edgeFunction";
import { saveMessage } from "../../saveData";
import { fetchUserInfo } from "../../utils";
import { WebClient } from "@slack/web-api";
import { fetchThreadMessages } from "../../utils/fetch/fetchThreadMessage";
import { summarizeMessages } from "../../utils/summarizeMessages";

export const handleMessageEvent = async (
  event: any,
  serviceRoleKey: string,
  workspaceId: string,
  client: WebClient
) => {
  const { user, ts, channel_type, thread_ts, files } = event;
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

  // スレッド内のメッセージ数を確認
  if (thread_ts) {
    const messages = await fetchThreadMessages(client, channelId, thread_ts);

    // 現在のスレッド内メッセージ数
    const messageCount = messages.length;

    // 10件単位でのみ処理する
    if (messageCount % 10 === 0) {
      // 対応する区間のメッセージを取得
      const startRange = messageCount - 9; // 現在の10件のスタート位置
      const endRange = messageCount; // 現在の10件の終了位置
      const messageChunk = messages.slice(startRange - 1, endRange); // インデックス調整

      // 要約処理をトリガー
      try {
        const summary = await summarizeMessages(messageChunk);

        // スレッド内に要約を投稿
        await client.chat.postMessage({
          channel: channelId,
          text: `*スレッドの要約 (${startRange}〜${endRange})*\n${summary}`,
          thread_ts: thread_ts,
        });

        // チャンネルにも表示（オプション）
        await client.chat.postMessage({
          channel: channelId,
          text: `*スレッドの要約 (${startRange}〜${endRange})*\n${summary}`,
        });
      } catch (error) {
        console.error("要約生成エラー:", error);
        await client.chat.postMessage({
          channel: channelId,
          text: `要約の生成中にエラーが発生しました。範囲: ${startRange}〜${endRange}`,
          thread_ts: thread_ts,
        });
      }
    }
  }

  // チャンネルに投稿されたメッセージだけを処理
  if (channel_type === "channel") {
    try {
      // Edge Function（キーワードポイント）を呼び出し
      console.log("callAddKeywordPointsEdgeFunctionを呼び出します");
      const edgeKeywordResponse = await callAddKeywordPointsEdgeFunction(
        serviceRoleKey,
        messageId,
        messageUserId
      );
      console.log(
        "Edge Function（キーワードポイント）の呼び出し成功:",
        edgeKeywordResponse
      );

      console.log("callAddMentionPointsEdgeFunctionを呼び出します");
      const edgeMentionResponse = await callAddMentionPointsEdgeFunction(
        serviceRoleKey,
        messageId,
        messageUserId
      );
      console.log(
        "Edge Function（メンションポイント）の呼び出し成功:",
        edgeMentionResponse
      );

      // ファイル共有のチェック
      if (files && files.length > 0) {
        console.log("callAddFileSharePointsEdgeFunctionを呼び出します");
        const edgeFileShareResponse = await callAddFileSharePointsEdgeFunction(
          serviceRoleKey,
          messageId,
          messageUserId
        );
        console.log(
          "Edge Function（ファイル共有ポイント）の呼び出し成功:",
          edgeFileShareResponse
        );
      }
    } catch (error) {
      console.error("メッセージチャンネルイベントエラー:", error);
    }
  }
};
