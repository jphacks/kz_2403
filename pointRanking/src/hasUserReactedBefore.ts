import { useSupabase } from "./hooks/useSupabase";

export const hasUserReactedBefore = async (messageId: string, reactionUserId: string): Promise<{
  hasReacted: boolean;
  existingReaction?: any;
}> => {
  try {
    const { supabase } = useSupabase();

    const { data, error } = await supabase
      .from("Reaction")
      .select("*")
      .eq("message_id", messageId)
      .eq("reaction_user_id", reactionUserId)
      .maybeSingle();

    console.log('haseUserReactedBefore - data', data );
    console.log('haseUserReactedBefore - error', error );

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
    }
  } catch (error) {
    console.error("リアクション履歴の確認エラー:", error);
    return { hasReacted: false };
  }
};