
import { callAddPointsEdgeFunction } from "../../edgeFunction";
import { callAddTimedPointsEdgeFunction } from "../../edgeFunction/callAddTimedPointsEdgeFunction";
import { ReactionData, saveReaction } from "../../saveData";
import { ensureHasUserReactedBefore, fetchMessageInfo, fetchUserInfo } from "../../utils";

export const handleReactionAdded = async (
  event: any,
  client: any,
  serviceRoleKey: string,
  workspaceId: string,
) => {
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
    messageId,
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
    workspaceId,
    reactionId: `${messageId}-${reactionUserId}-${emojiId}`,
    emojiId,
    emojiName,
    resultMonth: new Date().toISOString().slice(0, 7),
    points: 1,
  };

  try {
    // 既にリアクションをつけているかどうかをチェック
    const hasReacted = await ensureHasUserReactedBefore(
      messageId,
      reactionUserId,
      workspaceId,
    );
    console.log(`Debug - hasReacted:`, JSON.stringify(hasReacted));

    if (hasReacted.hasReacted) {
      console.log(
        "既に他のリアクションで初回ポイントが付与済みのため、スキップします",
      );
    } else {
      // リアクションデータを保存
      const isSaved = await saveReaction(payload);

      if (!isSaved) {
        console.log("既に同じリアクションが存在するため、スキップします");
      } else {
        console.log(
          "初めてのメッセージへのリアクションなので、ポイントを付与します",
        );
        const edgeResponse = await callAddPointsEdgeFunction(
          serviceRoleKey,
          messageId,
          reactionUserId,
        );
        const edgeTimedResponse = await callAddTimedPointsEdgeFunction(
          serviceRoleKey,
          messageId,
          reactionUserId,
        );
        console.log("Edge Function呼び出し成功:", edgeResponse);
        console.log(
          "Edge Function(addTimedPoints)の呼び出し成功",
          edgeTimedResponse,
        );
      }
    }
  } catch (error) {
    console.error("リアクション追加イベントエラー:", error);
  }
};
