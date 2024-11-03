import { useSupabase } from "./hooks/useSupabase"

interface Payload {
  messageId: string;
  messageText: string;
  messageUserId: string;
  channelId: string;
}

export const ensureMessageExists = async (payload: Payload): Promise<boolean> => {
  const { supabase } = useSupabase();

  // メッセージが存在するか確認
  const { data: messageExists, error: selectError } = await supabase
  .from("Message")
  .select("message_id")
  .eq("message_id", payload.messageId)
  .single();
  
  if (selectError) {
    console.error("Messageテーブルの取得エラー:", selectError);
    return false;
  }

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
    ]);

    if (insertMessageError) {
      console.error("Messageテーブルの挿入エラー:", insertMessageError);
      return false;
    }
  }

  return true;
}