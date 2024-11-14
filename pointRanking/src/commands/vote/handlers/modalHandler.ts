import { SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import { buildVoteMessage, buildVoteResultMessage } from "../utils/messageBuilder";
import { voteStore } from "../utils/voteStore";
import { WebClient } from "@slack/web-api";

export async function handleVoteModalSubmission({
  ack,
  view,
  client,
}: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) {
  await ack();

  try {
    const metadata = JSON.parse(view.private_metadata);
    const channelId = metadata.channelId;
    
    // 質問を取得
    const questionValue = view.state.values.vote_question_block?.vote_question?.value;
    if (!questionValue) {
      throw new Error("質問が入力されていません");
    }
    const question = questionValue;

    // 終了日時を取得
    const endDate = view.state.values.end_date_block?.end_date?.selected_date;
    const endTime = view.state.values.end_time_block?.end_time?.selected_time;

    if (!endDate || !endTime) {
      throw new Error("終了日時が入力されていません");
    }

    // 終了時刻をタイムスタンプに変換
    const [hours, minutes] = endTime.split(":");
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    const endTimestamp = endDateTime.getTime();

    // 現在時刻と比較
    if (endTimestamp <= Date.now()) {
      throw new Error("終了日時が現在時刻より前です");
    }

    if (!channelId) {
      throw new Error("チャンネルIDが見つかりません");
    }

    // 選択肢を取得
    const options: string[] = [];
    for (let i = 1; i <= metadata.optionCount; i++) {
      const optionValue = view.state.values[`vote_option${i}_block`]?.[`vote_option${i}`]?.value;
      if (optionValue?.trim()) {
        options.push(optionValue.trim());
      }
    }

    if (options.length < 2) {
      throw new Error("最低2つの選択肢が必要です");
    }

    // 投票メッセージを投稿
    const message = await client.chat.postMessage({
      channel: channelId,
      text: `*${question}*`,
      blocks: buildVoteMessage(question, options, endTimestamp),
    });

    if (!message.ts || typeof message.channel !== "string") {
      throw new Error("メッセージの投稿に失敗しました");
    }

    // 投票データを保存
    if (message.ts) {
      voteStore.set(message.ts, {
        channelId,
        options,
        votes: new Map(),
        endTime: endTimestamp,
      });

      // 終了時のタイマーをセット
      setTimeout(async () => {
        const voteData = message.ts ? voteStore.get(message.ts) : undefined;
        if (voteData) {
          // 結果を集計して投稿
          const results = Array.from(voteData.votes.entries())
            .map(([option, voters]) => ({
              option,
              count: voters.size,
              voters: Array.from(voters)
            }));

          await client.chat.postMessage({
            channel: channelId,
            text: "投票が終了しました",
            blocks: buildVoteResultMessage(voteData, questionValue, results)
          });

          // 投票データを削除
          if (message.ts) {
            voteStore.delete(message.ts);
          }
        }
      }, endTimestamp - Date.now());
    }
  } catch (error) {
    console.error("投票の作成に失敗しました:", error);
  }
}