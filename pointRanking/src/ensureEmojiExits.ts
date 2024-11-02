import { useSupabase } from "./hooks/useSupabase"

export const ensureEmojiExists = async( emojiId: string, emojiName: string): Promise<void> => {
  const { supabase } = useSupabase();

  const { data, error } = await supabase
  .from("Emoji")
  .select("emoji_id")
  .eq("emoji_id", emojiId)
  .single();

  if (error && error.code === "PGRST116") {
    const { error : insertError } = await supabase.from("Emoji").insert([
      { emoji_id: emojiId, emoji_name: emojiName } 
    ]);
  
    if (insertError) {
      console.error("Emojiテーブルの挿入エラー:", insertError);
    }
  } else if (error) {
    console.error("Emojiテーブルの取得エラー:", error);
  }
}