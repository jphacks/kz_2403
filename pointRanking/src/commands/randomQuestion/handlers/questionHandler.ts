import { WebClient } from "@slack/web-api";
import { questionStore } from "../utils/questionStore";
import { buildQuestionMessage } from "../utils/messageBuilder";
import { getRandomQuestion } from "../utils/questionUtils";

export async function sendRandomQuestion(client: WebClient, channelId: string) {
  try {
    // JSONファイルからランダムな質問を取得
    const randomQuestion = getRandomQuestion();

    // ワークスペースのユーザー一覧を取得
    const result = await client.users.list({
      limit: 1000,
    });

    const activeUsers = result.members?.filter(
      (user) => !user.is_bot && !user.is_restricted && !user.deleted && user.id
    );

    if (!activeUsers || activeUsers.length === 0) {
      throw new Error("有効なユーザーが見つかりません");
    }

    // ランダムにユーザーを選択
    const targetUser =
      activeUsers[Math.floor(Math.random() * activeUsers.length)];

    if (!targetUser.id) {
      throw new Error("ユーザーIDが見つかりません");
    }

    // 24時間後を期限に設定
    const endTime = Date.now() + 24 * 60 * 60 * 1000;

    // 質問をDMで送信
    await client.chat.postMessage({
      channel: targetUser.id,
      text: randomQuestion.text,
      blocks: buildQuestionMessage(randomQuestion.text, endTime),
    });

    // 質問データを保存
    questionStore.set(targetUser.id, {
      channelId,
      question: randomQuestion.text,
      targetUserId: targetUser.id,
      endTime,
      isAnswered: false,
    });


    console.log(`ランダム質問を送信しました: ユーザーID: ${targetUser.id}, ユーザー名: ${targetUser.name}`);
  } catch (error) {
    console.error("ランダム質問の送信に失敗しました:", error);
    throw error;
  }
}
