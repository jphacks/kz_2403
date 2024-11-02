import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import { fetchMessageInfo } from "./fetchMessageInfo";
import { fetchUserInfo } from "./fetchUserInfo";
import { saveReactionData } from "./saveReactionData";
import { callEdgeFunction } from "./callEdgeFunction";
import { ReactionData } from "./saveReaction";
import { hasUserReactedBefore } from "./hasUserReactedBefore";

(async () => {
  const { slackBot, PORT } = useSlackbot();
  const { edgeFunctionUrl, serviceRoleKey } = useSupabase();

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
        console.log("既に他のリアクションで初回ポイントが付与済みのため、スキップします")
      } else {
        // リアクションデータを保存
        const isSaved = await saveReactionData(payload);

        if (!isSaved) {
          console.log("既に同じリアクションが存在するため、スキップします");
        } else {
          console.log("初めてのメッセージへのリアクションなので、ポイントを付与します");
          const edgeResponse = await callEdgeFunction(edgeFunctionUrl, serviceRoleKey, messageId, reactionUserId);
          console.log("Edge Function呼び出し成功:", edgeResponse);
        }
      }
    } catch (error) {
      console.error("リアクション追加イベントエラー:", error);
    }
  });

  // アプリの起動
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を起動しました`);
})();
