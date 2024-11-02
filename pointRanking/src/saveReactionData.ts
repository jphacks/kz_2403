import { ReactionData } from "./saveReaction";
import { useSupabase } from "./hooks/useSupabase";
import { ensureEmojiExists } from "./ensureEmojiExits";
import 'dotenv/config'

export const saveReactionData = async (payload: ReactionData): Promise<boolean> => {
  try {
    const { supabase } = useSupabase();
    // メッセージが存在するか確認
    const { data: messageExists } = await supabase.from("Message").select("message_id").eq("message_id", payload.messageId).single();

    // メッセージが存在しない場合は保存
    if (!messageExists) {
      const { error: insertMessageError } = await supabase.from("Message").insert([
        {
          message_id: payload.messageId,
          created_at: new Date().toISOString(),
          message_text: payload.messageText,
          message_user_id: payload.messageUserId,
          channnel_id: payload.channelId,
          update_at: new Date().toISOString(),
        }
      ])  ;

      if (insertMessageError) {
        console.error("Messageテーブルの挿入エラー:", insertMessageError);
        return false;
      }
    }

    // Emojiが存在することを確認
    await ensureEmojiExists(payload.emojiId, payload.emojiName);

    // リアクションを保存
    const { error: insertReactionError } = await supabase.from("Reaction").insert([
      {
        reaction_id: payload.reactionId,
        created_at: new Date().toISOString(),
        message_id: payload.messageId,
        reaction_user_id: payload.reactionUserId,
        emoji_id: payload.emojiId,
      },
    ]);

    if (insertReactionError) {
      console.error("Reactionテーブルの挿入エラー:", insertReactionError);
      return false;
    }

    return true; // 挿入が成功した場合
  } catch (error) {
    console.error("リアクションデータの保存エラー:", error);
    return false;
  }
};