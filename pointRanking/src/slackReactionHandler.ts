import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import { fetchMessageInfo } from "./fetchMessageInfo";
import { fetchUserInfo } from "./fetchUserInfo";
import { saveReactionData } from "./saveReactionData";
import { ReactionData } from "./saveReaction";
import { hasUserReactedBefore } from "./hasUserReactedBefore";
import { callAddPointsEdgeFunction } from "./edgeFunction/callAddPointsEdgeFunction";
import { callAddKeywordPointsEdgeFunction } from "./edgeFunction/callAddKeywordPointsEdgeFunction";
import { saveMessageData } from "./saveMessageData"; // 新しく追加
import { callAddMentionPointsEdgeFunction } from "./edgeFunction/callAddMentionPointsEdgeFunction";
import { callAddTimedPointsEdgeFunction } from "./edgeFunction/callAddTimedPointsEdgeFunction";

interface MessageEvent {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  event_ts: string;
  channel_type: string;
}

(async () => {
  const { slackBot, PORT } = useSlackbot();
  const { serviceRoleKey } = useSupabase();

  slackBot.event("reaction_added", async ({ event, client }) => {
    const { reaction, user, item } = event;
    const messageId = item.ts;
    const channelId = item.channel;
    const reactionUserId = user;
    const emojiName = reaction;
    const emojiId = `emoji-${emojiName}`;

    // メッセージ情報の取得
    const { messageUserId, messageText } = await fetchMessageInfo(
      client,
      channelId,
      messageId
    );

    // ユーザー情報の取得
    const userName = await fetchUserInfo(client, reactionUserId);

    // ペイロードの作成
    const payload: ReactionData = {
      userId: reactionUserId,
      userName,
      messageId,
      messageText: messageText || "メッセージなし",
      messageUserId,
      channelId,
      reactionUserId,
      reactionId: `${messageId}-${reactionUserId}-${emojiId}`,
      emojiId,
      emojiName,
      resultMonth: new Date().toISOString().slice(0, 7),
      points: 1,
    };

    try {
      // 既にリアクションをつけているかどうかをチェック
      const hasReacted = await hasUserReactedBefore(messageId, reactionUserId);
      console.log(`Debug - hasReacted:`, JSON.stringify(hasReacted));

      if (hasReacted.hasReacted) {
        console.log(
          "既に他のリアクションで初回ポイントが付与済みのため、スキップします"
        );
      } else {
        // リアクションデータを保存
        const isSaved = await saveReactionData(payload);

        if (!isSaved) {
          console.log("既に同じリアクションが存在するため、スキップします");
        } else {
          console.log(
            "初めてのメッセージへのリアクションなので、ポイントを付与します"
          );
          const edgeResponse = await callAddPointsEdgeFunction(
            serviceRoleKey,
            messageId,
            reactionUserId
          );
          const edgeTimedResponse = await callAddTimedPointsEdgeFunction(
            serviceRoleKey,
            messageId,
            reactionUserId
          );
          console.log("Edge Function呼び出し成功:", edgeResponse);
          console.log(
            "Edge Function(addTimedPoints)の呼び出し成功",
            edgeTimedResponse
          );
        }
      }
    } catch (error) {
      console.error("リアクション追加イベントエラー:", error);
    }
  });

  slackBot.event("message", async ({ event, client }) => {
    const messageEvent = event as MessageEvent;
    const { user, ts, channel_type } = messageEvent;
    const messageId = ts;
    const messageUserId = user;
    const channelId = messageEvent.channel;

    // メッセージデータを保存
    const isMessageSaved = await saveMessageData({
      messageId,
      messageText: messageEvent.text,
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
      } catch (error) {
        console.error("メッセージチャンネルイベントエラー:", error);
      }
    }
  });

  // アプリの起動
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を起動しました`);
})();
