import { useSupabase } from "./hooks/useSupabase";

interface Payload {
  messageId: string;
  workspaceId: string;
  messageText: string;
  userId: string;
  channelId: string;
}

export const saveMessageData = async (payload: Payload): Promise<boolean> => {
  const { supabase } = useSupabase();

  // メッセージが存在するか確認
  const { data: messageExists, error: selectError } = await supabase
    .from("MessageNew")
    .select("message_id")
    .eq("message_id", payload.messageId)
    .eq("workspace_id", payload.workspaceId)
    .single();

  // PGRST116エラーの場合はメッセージが存在しないため、新しいメッセージを挿入
  if (selectError && selectError.code === "PGRST116") {
    const { error: insertMessageError } = await supabase
      .from("MessageNew")
      .insert([
        {
          message_id: payload.messageId,
          workspace_id: payload.workspaceId,
          message_text: payload.messageText,
          user_id: payload.userId,
          channel_id: payload.channelId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
