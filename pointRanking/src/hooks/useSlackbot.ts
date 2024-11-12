import { App } from "@slack/bolt";
import { useSupabase } from "./useSupabase";
import { WebClient } from "@slack/web-api";

type WorkspaceData = {
  slack_bot_token: string;
  slack_signing_token: string;
  workspace_id: string;
};

async function getWorkspaceConfig() {
  try {
    let { supabase } = useSupabase();
    // WorkSpaceNewテーブルからデータを取得
    const { data, error } = await supabase
      .from("WorkspaceNew")
      .select("slack_bot_token, slack_signing_token, workspace_id")
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
      workspace_id: data.workspace_id
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

  let botToken = config.slack_bot_token;
  let signingSecret = config.slack_signing_secret;
  let workspaceId = config.workspace_id;

  // 環境変数や型ファイルを適用したクライアントを作成
  const slackBot = new App({
    token: botToken,
    signingSecret: signingSecret,
  });

  const slackClient = new WebClient(botToken);

  const PORT = 3000;

  return { slackBot, botToken, slackClient, PORT, workspaceId };
  };
