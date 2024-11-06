import { useSupabase } from "./hooks/useSupabase";

interface Payload {
  messageId: string;
  messageText: string;
  messageUserId: string;
  channelId: string;
}

export const saveMessageData = async (payload: Payload): Promise<boolean> => {
  const { supabase } = useSupabase();

  // メッセージが存在するか確認
  const { data: messageExists, error: selectError } = await supabase
    .from("Message")
    .select("message_id")
    .eq("message_id", payload.messageId)
    .single();

  // PGRST116エラーの場合はメッセージが存在しないため、新しいメッセージを挿入
  if (selectError && selectError.code === "PGRST116") {
    const { error: insertMessageError } = await supabase
      .from("Message")
      .insert([
        {
          message_id: payload.messageId,
          created_at: new Date().toISOString(),
          message_text: payload.messageText,
          message_user_id: payload.messageUserId,
          channnel_id: payload.channelId,
          update_at: new Date().toISOString(),
        },
      ]);

    if (insertMessageError) {
      console.error("Messageテーブルの挿入エラー:", insertMessageError);
      return false;
    }
  } else if (selectError) {
    // その他のエラーの場合はログを出力
    console.error("Messageテーブルの取得エラー:", selectError);
    return false;
  }

  return true;
};
