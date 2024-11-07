import { SlackCommandMiddlewareArgs } from "@slack/bolt";
import axios from "axios";

export default function myPointsCommand(slackBot: any, supabase: any) {
  slackBot.command("/mypoints", async ({ command, ack }: SlackCommandMiddlewareArgs) => {
    try {
      await ack();
      handleMyPoints(command, supabase).catch(console.error);
    } catch (error) {
      console.error("ackのエラー:", error);
    }
  });
}

async function handleMyPoints(command: SlackCommandMiddlewareArgs["command"], supabase: any) {
  try {
    const userId = command.user_id;

    const { data: allUsersData, error: allUsersError } = await supabase
      .from("User")
      .select("user_id, user_name, total_point")
      .order("total_point", { ascending: false });

    if (allUsersError) {
      console.error("Userテーブルの取得エラー:", allUsersError);
      await axios.post(command.response_url, {
        text: "データの取得に失敗しました",
        response_type: "ephemeral",
      });
      return;
    }

    const userData = allUsersData.find((user: any) => user.user_id === userId);

    if (!userData) {
      console.error("ユーザーが見つかりません");
      await axios.post(command.response_url, {
        text: "ユーザーが見つかりません",
        response_type: "ephemeral",
      });
      return;
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

    await axios.post(command.response_url, {
      blocks,
      response_type: "ephemeral",
    });
  } catch (error) {
    console.error("ユーザーポイント取得エラー:", error);
    await axios.post(command.response_url, {
      text: "データの取得に失敗しました",
      response_type: "ephemeral",
    });
  }
}