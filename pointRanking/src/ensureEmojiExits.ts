import { useSupabase } from "./hooks/useSupabase";

export const ensureEmojiExists = async (
  workspaceId: string,
  emojiId: string,
  emojiName: string
): Promise<void> => {
  const { supabase } = useSupabase();

  const { error } = await supabase
    .from("Emoji")
    .select("emoji_id")
    .eq("workspace_id", workspaceId)
    .eq("emoji_id", emojiId)
    .single();

  // errorオブジェクトが存在して、エラーコードがPGRST116の場合
  if (error && error.code === "PGRST116") {
    const { error: insertError } = await supabase
      .from("Emoji")
      .insert([{ workspace_id: workspaceId, emoji_id: emojiId, emoji_name: emojiName }]);

    if (insertError) {
      console.error("Emojiテーブルの挿入エラー:", insertError);
    }
  } else if (error) {
    console.error("Emojiテーブルの取得エラー:", error);
  }
};
