import { ReactionData } from "./saveReaction";
import { useSupabase } from "./hooks/useSupabase";
import { ensureEmojiExists } from "./ensureEmojiExits";
import "dotenv/config";
import { ensureMessageExists } from "./ensureMessageExists";

export const saveReactionData = async (
  payload: ReactionData
): Promise<boolean> => {
  try {
    const { supabase } = useSupabase();

    // メッセージが存在するか確認
    const result = await ensureMessageExists(payload);
    if (!result) {
      // エラーハンドリング
      return false;
    }

    // Emojiが存在することを確認
    await ensureEmojiExists(payload.emojiId, payload.emojiName);

    // リアクションを保存
    const { error: insertReactionError } = await supabase
      .from("Reaction")
      .insert([
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
