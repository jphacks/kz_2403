import { useSupabase } from "./hooks/useSupabase";

type ReactionData = {
  userId: string;
  userName: string;
  messageId: string;
  messageText: string;
  messageUserId: string;
  channelId: string;
  reactionId: string;
  reactionUserId: string;
  emojiId: string;
  emojiName: string;
  resultMonth: string;
  points: number;
};

export async function saveReactionData({
  userId,
  userName,
  messageId,
  messageText,
  messageUserId,
  channelId,
  reactionId,
  reactionUserId,
  emojiId,
  emojiName,
  resultMonth,
  points,
}: ReactionData) {
  const { supabase } = useSupabase();

  try {
    // userテーブルの更新
    const { data: user, error: userError } = await supabase.from("User").upsert(
      {
        user_id: userId,
        user_name: userName,
        total_point: points,
        update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    // エラー処理
    if (userError) {
      console.error(userError);
      return;
    }

    // reactionテーブルの更新
    const { data: reaction, error: reactionError } = await supabase
      .from("Reaction")
      .upsert(
        {
          reaction_id: reactionId,
          created_at: new Date().toISOString(),
          message_id: messageId,
          reaction_user_id: reactionUserId,
          emoji_id: emojiId,
        },
        { onConflict: "reaction_id" }
      );

    // エラー処理
    if (reactionError) {
      console.error(reactionError);
      return;
    }

    // emojiテーブルの更新
    const { data: emoji, error: emojiError } = await supabase
      .from("Emoji")
      .upsert(
        {
          emoji_id: emojiId,
          emoji_name: emojiName,
          usage_num: 1, // 1つ追加されたと仮定
          add_user_id: reactionUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "emoji_id" }
      );

    if (emojiError) {
      console.error("Emojiテーブルの更新エラー:", emojiError);
      return;
    }

    // monthlogテーブルの更新
    const { data: monthLog, error: monthLogError } = await supabase
      .from("MonthLog")
      .upsert(
        {
          result_month: resultMonth,
          user_id: userId,
          month_total_point: points,
          reaction_1st_num: 1, // 1つ追加されたと仮定
          add_emoji_num: 1, // 1つ追加されたと仮定
          message_send_num: 1, // 1つ追加されたと仮定
          update_at: new Date().toISOString(),
        },
        { onConflict: "result_month" }
      );

    if (monthLogError) {
      console.error("MonthLogテーブルの更新エラー:", monthLogError);
      return;
    }
    console.log("リアクションデータの保存完了");
  } catch (error) {
    console.error("エラー:", error);
  }
}
