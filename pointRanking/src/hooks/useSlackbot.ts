import { useSupabase } from "./useSupabase";

type WorkspaceData = {
  slack_bot_token: string;
  slack_signing_token: string;
};

async function getWorkspaceConfig() {
  try {
    let { supabase } = useSupabase();
    // WorkSpaceNewテーブルからデータを取得
    const { data, error } = await supabase
      .from("WorkspaceNew")
      .select("slack_bot_token, slack_signing_token")
      .single<WorkspaceData>();

    if (error) {
      throw new Error(
        `Supabaseからのデータの取得に失敗しました: ${error.message}`
      );
    }

    if (!data) {
      throw new Error("WorkspaceNewテーブルにデータが存在しません");
    }

    return {
      slack_bot_token: data.slack_bot_token,
      slack_signing_secret: data.slack_signing_token,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `ワークスペースの設定情報の取得に失敗しました: ${error.message}`
      );
    }
    throw new Error(`ワークスペースの設定情報の取得に失敗しました`);
  }
}

export const useSlackbot = async () => {
  const config = await getWorkspaceConfig();

  if (!config.slack_bot_token || !config.slack_signing_secret) {
    throw new Error("Slackbotの設定情報が不足しています");
  }

  return {
    botToken: config.slack_bot_token,
    signingSecret: config.slack_signing_secret,
  }
};
