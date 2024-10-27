import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import { ReactionData, saveReactionData } from "./saveReaction";

// slackのリアクションをsupabaseに保存する
(async () => {
  const { slackBot, PORT } = useSlackbot();
  const { supabase, edgeFunctionUrl, serviceRoleKey } = useSupabase();

  // Slackリアクションが追加された時の処理
  slackBot.event("reaction_added", async ({ event, client }) => {
    const { reaction, user, item, event_ts } = event;
    // DBに合わせて各種プロパティを変換
    const messageId = item.ts;
    const createdAt = new Date(parseInt(event_ts) * 1000).toISOString(); // 人間に読める形にするため
    const reactionUserId = user;
    const emojiName = reaction;
    const emojiId = `emoji-${emojiName}`;
    const channelId = item.channel;

    // リアクションを受けたメッセージの送信者のIDを取得
    let messageUserId = "unknown_user"; //初期値
    let userName = "unknown_user"; //初期値
    let messageText = "unknown"; //初期値

    try {
      // メッセージ情報を取得して、送信者のIDを取得
      const result = await client.conversations.history({
        channel: channelId,
        latest: messageId,
        inclusive: true,
        limit: 1,
      });

      if (result.messages && result.messages.length > 0) {
        const message = result.messages[0];
        messageUserId = result.messages[0].user || "unknown_user";
        messageText = message.text || "unknown";
      }
    } catch (error) {
      console.error("メッセージ取得", error);
    }

    // ユーザー情報を取得し、ユーザー名を取得
    try {
      const userInfo = await client.users.info({ user: reactionUserId });
      if (userInfo.user && userInfo.user.profile) {
        userName =
          userInfo.user.profile.real_name ||
          userInfo.user.profile.display_name ||
          "unknown";
      }
    } catch (error) {
      console.error("ユーザー情報取得", error);
    }

    // Supabaseに保存するペイロード
    const payload: ReactionData = {
      userId: reactionUserId,
      userName,
      messageId,
      messageText,
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
      // リアクションが既に存在するか確認
      const { data: existingReactions, error: reactionsFetchError } = await supabase
        .from("Reaction")
        .select("reaction_id")
        .eq("message_id", messageId)
        .eq("reaction_user_id", reactionUserId)
        .eq("emoji_id", emojiId);

      if (reactionsFetchError) {
        console.error("Reactionテーブルの取得エラー:", reactionsFetchError);
        return;
      }

      let isReactionSaved = false;

      if (existingReactions.length === 0) {
        // リアクションが存在しない場合、ポイントを加算して保存
        isReactionSaved = await saveReactionData(payload);
      } else {
        // リアクションが存在する場合、ポイントを加算せずに保存
        const { error: reactionError } = await supabase
          .from("Reaction")
          .upsert(
            {
              reaction_id: payload.reactionId,
              created_at: new Date().toISOString(),
              message_id: payload.messageId,
              reaction_user_id: payload.reactionUserId,
              emoji_id: payload.emojiId,
            },
            { onConflict: "reaction_id" }
          );

        if (reactionError) {
          console.error("Reactionテーブルの更新エラー:", reactionError);
        } else {
          isReactionSaved = true;
        }
      }

      if (isReactionSaved) {
        console.log("リアクションデータを保存しました");

        // Edge Functionの呼び出し
        try {
          const response = await fetch(edgeFunctionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ messageId, reactionUserId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Edge Functionエラー:", errorData);
          } else {
            const data = await response.json();
            console.log("Edge Function呼び出し成功:", data);
          }
        } catch (error) {
          console.error("Edge Functionの呼び出しエラー:", error);
        }
      } else {
        console.log("リアクションデータの保存に失敗しました");
      }
    } catch (error) {
      console.error("リアクションデータの保存に失敗しました", error);
    }
  });

  // アプリの起動
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を立ち上げました`);
})();