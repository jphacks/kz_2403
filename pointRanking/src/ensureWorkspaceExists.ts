import { useSupabase } from "./hooks/useSupabase";

export const ensureWorkspaceExists = async (workspaceId: string): Promise<boolean> => {
  const { supabase } = useSupabase();
    // workspace_idが有効かどうかを確認
    const { data: workspaceData, error: workspaceError } = await supabase
    .from("WorkspaceNew")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .single();

  if (workspaceError) {
    console.error("Supabaseエラー:", workspaceError);
    return false;
  }

  if (!workspaceData) {
    console.error("無効なworkspace_idです: workspace_idが見つかりません");
    return true;
  }
  return true;
}