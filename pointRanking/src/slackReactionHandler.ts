import { useSlackbot } from "./hooks/useSlackbot"
import { ReactionData, saveReactionData } from "./saveReaction";

// slackのリアクションをsupabaseに保存する
(async () => {
  const { slackBot, PORT } = useSlackbot();
  
  //  lackリアクションが追加された時の処理
  slackBot.event('reaction_added', async ({ event, client }) => {
    const { reaction, user, item, event_ts } = event;
    // DBに合わせて各種プロパティを変換
    const messageId = item.ts;
    const createdAt = new Date(parseInt(event_ts)*1000).toISOString(); // 人間に読める形にするため
    const reactionUserId = user;
    const emojiName = reaction;
    const emojiId = `emoji-${emojiName}`;
    const channelId = item.channel;

    // リアクションを受けたメッセージの送信者のIDを取得
    let messageUserId = "unknown_user"; //初期値

    try {
      // メッセージ情報を取得して、送信者のIDを取得
      const result = await client.conversations.history({
        channel: channelId,
        latest: messageId,
        inclusive: true,
        limit: 1,
      });

      if (result.messages && result.messages.length > 0) {
        messageUserId = result.messages[0].user || "unknown_user";
      }
    } catch(error) {
      console.error("メッセージ取得", error);
    }

    // Supabaseに保存するペイロード
    const payload: ReactionData = {
      userId: reactionUserId,
      userName: "unknown",
      messageId,
      messageText: "unknown",
      messageUserId,
      channelId,
      reactionUserId,
      reactionId: `${messageId}-${reactionUserId}`,
      emojiId,
      emojiName,
      resultMonth: new Date().toISOString().slice(0, 7),
      points: 1,
    };

    // リアクションデータの保存
    try {
      await saveReactionData(payload);
      console.log("リアクションデータを保存しました");
    } catch (error) {
      console.error("リアクションデータの保存に失敗しました", error);
    }

    try {
      // edgeFunctionsの呼び出し
    } catch (error) {
      console.error(error);
    }
  });

  // アプリの起動
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を立ち上げました`);
})();