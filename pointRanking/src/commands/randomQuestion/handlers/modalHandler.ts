import { SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { questionStore } from "../utils/questionStore";

export async function handleQuestionAnswerSubmission({
  ack,
  view,
  client,
  body,
}: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) {
  ack();

  try {
    // 質問データを取得
    const questionData = questionStore.get(body.user.id);
    if (!questionData) {
      throw new Error("質問データが見つかりません");
    }

    // 回答を取得
    const answer = view.state.values.answer_input?.answer?.value;
    if (!answer) {
      throw new Error("回答が入力されていません");
    }

    // メッセージ投稿を非同期で実行
    const postMessage = async () => {
      try {
        // 回答を公開チャンネルに投稿
        await client.chat.postMessage({
          channel: questionData.channelId,
          text: `*質問への回答が届きました！*\n\n*質問*\n${questionData.question}\n\n*回答者*\n<@${body.user.id}>\n\n*回答*\n${answer}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*質問への回答が届きました！*",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*質問*\n${questionData.question}`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*回答者*\n<@${body.user.id}>`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*回答*\n${answer}`,
              },
            },
          ],
        });

        // 回答済みフラグを更新
        questionStore.set(body.user.id, {
          ...questionData,
          isAnswered: true,
        });

        // DMのメッセージを更新
        await client.chat.postMessage({
          channel: body.user.id,
          text: "回答ありがとうございました！",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `回答を送信しました！\n\n*質問*\n${questionData.question}\n\n*あなたの回答*\n${answer}`,
              },
            },
          ],
        });
      } catch (error) {
        console.error("回答の送信中にエラーが発生:", error);
      }
    };

    // メッセージ投稿を非同期で実行
    postMessage().catch(console.error);
  } catch (error) {
    console.error("回答の処理中にエラーが発生:", error);
    // エラーメッセージをDMで送信
    try {
      await client.chat.postMessage({
        channel: body.user.id,
        text: "回答の送信中にエラーが発生しました。もう一度お試しください。",
      });
    } catch (dmError) {
      console.error("エラーメッセージの送信に失敗:", dmError);
    }
  }
}
