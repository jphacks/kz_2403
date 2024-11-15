import { useSupabase } from "../../hooks/useSupabase";

type UserPayload = {
  userId: string;
  userName: string;
  workspaceId: string;
}

export const ensureUserExists = async (payload: UserPayload): Promise<boolean> => {
  const { supabase } = useSupabase();

  // ユーザーが存在するか確認
  const { data: userExists, error: selectError } = await supabase
    .from("UserNew")
    .select("user_id")
    .eq("user_id", payload.userId)
    .eq("workspace_id", payload.workspaceId)
    .single();

  // PGRST116エラーの場合はユーザーが存在しないため、新しいユーザーを挿入
  if (selectError && selectError.code === "PGRST116") {
    const { error: insertUserError } = await supabase
      .from("UserNew")
      .insert([
        {
          user_id: payload.userId,
          user_name: payload.userName,
          workspace_id: payload.workspaceId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_point: 0,
        },
      ]);

    if (insertUserError) {
      console.error("UserNewテーブルの挿入エラー:", insertUserError);
      return false;
    }
  } else if (selectError) {
    // その他のエラーの場合はログを出力
    console.error("UserNewテーブルの取得エラー:", selectError);
    return false;
  }

  return true;
}