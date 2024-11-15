import { useSupabase } from "../../hooks/useSupabase";
import { ensureWorkspaceExists } from "./ensureWorkspaceExists";

export const ensureEmojiExists = async (
  workspaceId: string,
  emojiId: string,
  emojiName: string,
  label?: string
): Promise<void> => {
  const { supabase } = useSupabase();

  //workspace_idが有効かどうかを確認
  const workspaceExists = await ensureWorkspaceExists(workspaceId);

  if (!workspaceExists) {
    return;
  }

  const { data: emojiData, error: emojiError } = await supabase
    .from("EmojiNew")
    .select("emoji_id")
    .eq("workspace_id", workspaceId)
    .eq("emoji_id", emojiId)
    .single();

  if (emojiError && emojiError.code === "PGRST116") {
    // Emojiが存在しない場合、新しいEmojiを挿入
    const { error: insertError } = await supabase
      .from("EmojiNew")
      .insert([
        {
          workspace_id: workspaceId,
          emoji_id: emojiId,
          emoji_name: emojiName,
          label: label ?? '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error("EmojiNewテーブルの挿入エラー:", insertError);
    }
  } else if (emojiError) {
    console.error("EmojiNewテーブルの取得エラー:", emojiError);
  }
};