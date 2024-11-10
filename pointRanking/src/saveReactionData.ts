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
    await ensureEmojiExists(payload.emojiId, payload.emojiName, payload.workspaceId);

    // リアクションを保存
    const { error: insertReactionError } = await supabase
      .from("ReactionNew")
      .insert([
        {
          reaction_id: payload.reactionId,
          workspace_id: payload.workspaceId,
          message_id: payload.messageId,
          user_id: payload.userId,
          emoji_id: payload.emojiId,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertReactionError) {
      console.error("ReactionNewテーブルの挿入エラー:", insertReactionError);
      return false;
    }
    return true; // 挿入が成功した場合
  } catch (error) {
    console.error("リアクションデータの保存エラー:", error);
    return false;
  }
};
