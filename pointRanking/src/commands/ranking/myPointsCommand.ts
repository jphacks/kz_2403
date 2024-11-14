import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";

export default function myPointsCommand(slackBot: any, supabase: any) {
  slackBot.command(
    "/mypoints",
    async ({ command, ack, client }: SlackCommandMiddlewareArgs & { client: any }) => {
      try {
        await ack();
        await handleMyPoints(client, command.channel_id, command.user_id, command.team_id);
      } catch (error) {
        console.error("ackのエラー:", error);
      }
    }
  );

  const handleMyPoints = async (
    client: WebClient,
    channelId: string,
    userId: string,
    workspaceId: string
  ) => {
    try {
      const { data: allUsersData, error: allUsersError } = await supabase
        .from("UserNew")
        .select("user_id, workspace_id, user_name, total_point")
        .eq("workspace_id", workspaceId)
        .order("total_point", { ascending: false });

      if (allUsersError) {
        throw new Error("UserNewテーブルの取得に失敗しました");
      }

      const userData = allUsersData.find(
        (user: any) => user.user_id === userId
      );

      if (!userData) {
        throw new Error("ユーザーが見つかりません");
      }

      const userRank =
        allUsersData.findIndex((user: any) => user.user_id === userId) + 1;

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `あなたのポイント\n*${userData.user_name}* : ${userData.total_point}pt\n順位: ${userRank}位`,
          },
        },
      ];

      await client.chat.postMessage({
        channel: channelId,
        blocks: blocks,
        text: `あなたのポイント: ${userData.total_point}pt (${userRank}位)`,
      });
    } catch (error) {
      console.error("ユーザーポイント取得エラー:", error);
      await client.chat.postMessage({
        channel: channelId,
        text: "データの取得に失敗しました",
      });
    }
  };

  return { handleMyPoints };
}