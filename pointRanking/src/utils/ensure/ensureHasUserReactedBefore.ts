import { useSupabase } from "../../hooks/useSupabase";

export const ensureHasUserReactedBefore = async (
  messageId: string,
  userId: string,
  workspaceId: string,
): Promise<{
  hasReacted: boolean;
  existingReaction?: any;
}> => {
  try {
    const { supabase } = useSupabase();

    const { data, error } = await supabase
      .from("ReactionNew")
      .select("*")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    console.log("haseUserReactedBefore - data", data);
    console.log("haseUserReactedBefore - error", error);

    if (error) {
      if (error.code === "PGRST116") {
        // データが見つからない場合
        return { hasReacted: false };
      }
      // その他のエラー
      console.error("リアクション履歴の取得エラー:", error);
      return { hasReacted: false };
    }

    // データが存在する場合のみtrueを返す
    return {
      hasReacted: data !== null,
      existingReaction: data,
    };
  } catch (error) {
    console.error("リアクション履歴の確認エラー:", error);
    return { hasReacted: false };
  }
};
