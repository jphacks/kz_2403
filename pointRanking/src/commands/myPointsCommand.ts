import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import axios from "axios";

export default function myPointsCommand(slackBot: any, supabase: any) {
  slackBot.command("/mypoints", async ({ command, ack }: SlackCommandMiddlewareArgs) => {
    try {
      await ack();
      handleMyPoints(command.response_url, command.user_id).catch(console.error);
    } catch (error) {
      console.error("ackのエラー:", error);
    }
  });


  const handleMyPoints = async (channelId: string, userId: string) => {
  try {
    const { data: allUsersData, error: allUsersError } = await supabase
      .from("User")
      .select("user_id, user_name, total_point")
      .order("total_point", { ascending: false });

    if (allUsersError) {
      throw new Error("Userテーブルの取得に失敗しました");
    }

    const userData = allUsersData.find((user: any) => user.user_id === userId);

    if (!userData) {
      throw new Error("ユーザーが見つかりません");
    }

    const userRank = allUsersData.findIndex((user: any) => user.user_id === userId) + 1;

    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `あなたのポイント\n*${userData.user_name}* : ${userData.total_point}pt\n順位: ${userRank}位`,
        },
      },
    ];

    await axios.post(channelId, {
      blocks,
      response_type: "ephemeral",
    });
  } catch (error) {
    console.error("ユーザーポイント取得エラー:", error);
    await axios.post(channelId, {
      text: "データの取得に失敗しました",
      response_type: "ephemeral",
    });
  }
}}