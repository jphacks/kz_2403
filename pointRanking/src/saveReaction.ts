import { useSupabase } from "./hooks/useSupabase";

export type ReactionData = {
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
    // Userテーブルの更新
    const { data: existingUser, error: userFetchError } = await supabase
      .from("User")
      .select("total_point")
      .eq("user_id", userId)
      .single();

    if (userFetchError && userFetchError.code !== "PGRST116") {
      console.error("Userテーブルの取得エラー:", userFetchError);
      return;
    }

    let totalPoints = points;
    if (existingUser) {
      totalPoints += existingUser.total_point;
    }

    const { error: userError } = await supabase.from("User").upsert(
      {
        user_id: userId,
        user_name: userName,
        total_point: totalPoints,
      },
      { onConflict: "user_id" }
    );

    if (userError) {
      console.error("Userテーブルの更新エラー:", userError);
      return;
    }

    // Messageテーブルの更新
    const { error: messageError } = await supabase
      .from("Message")
      .upsert(
        {
          message_id: messageId,
          created_at: new Date().toISOString(),
          message_text: messageText,
          message_user_id: messageUserId,
          channnel_id: channelId,
        },
        { onConflict: "message_id" }
      );

    if (messageError) {
      console.error("Messageテーブルの更新エラー:", messageError);
      return;
    }

    // Emojiテーブルの更新（存在しない場合は新規作成）
    const { error: emojiError } = await supabase
      .from("Emoji")
      .upsert(
        {
          emoji_id: emojiId,
          emoji_name: emojiName,
          usage_num: 1, // 新規追加の場合は使用回数1とする
          add_user_id: reactionUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "emoji_id" }
      );

    if (emojiError) {
      console.error("Emojiテーブルの更新エラー:", emojiError);
      return;
    }

    // Reactionテーブルの更新
    const { error: reactionError } = await supabase
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

    if (reactionError) {
      console.error(reactionError);
      return;
    }

    const formattedResultMonth = `${resultMonth}-01`;
    // MonthLogテーブルの更新
    const { data: existingMonthLog, error: monthLogFetchError } = await supabase
      .from("MonthLog")
      .select("month_total_point, reaction_1st_num, add_emoji_num, message_send_num")
      .eq("result_month", formattedResultMonth)
      .eq("user_id", userId)
      .single();

    if (monthLogFetchError && monthLogFetchError.code !== "PGRST116") {
      console.error("MonthLogテーブルの取得エラー:", monthLogFetchError);
      return;
    }

    let monthTotalPoints = points;
    let reaction1stNum = 1;
    let addEmojiNum = 1;
    let messageSendNum = 1;

    if (existingMonthLog) {
      monthTotalPoints += existingMonthLog.month_total_point;
      reaction1stNum += existingMonthLog.reaction_1st_num;
      addEmojiNum += existingMonthLog.add_emoji_num;
      messageSendNum += existingMonthLog.message_send_num;
    }

    const { error: monthLogError } = await supabase
      .from("MonthLog")
      .upsert(
        {
          result_month: formattedResultMonth,
          user_id: userId,
          month_total_point: monthTotalPoints,
          reaction_1st_num: reaction1stNum,
          add_emoji_num: addEmojiNum,
          message_send_num: messageSendNum,
        },
        { onConflict: "result_month,user_id" }
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