import { SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import { buildVoteMessage } from "../utils/messageBuilder";
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
    // questionの型安全性を確保
    const questionValue = view.state.values.vote_question_block?.vote_question?.value;
    if (!questionValue) {
      throw new Error("質問が入力されていません");
    }
    const question = questionValue;

    // duration値の取得と型チェック
    const durationValue = view.state.values.duration_block?.duration?.value;
    const duration = durationValue ? parseInt(durationValue) : 60; // デフォルトは60分
    const endTime = Date.now() + duration * 60 * 1000;

    if (!channelId) {
      throw new Error("チャンネルIDが見つかりません");
    }

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

    const message = await client.chat.postMessage({
      channel: channelId,
      text: `*${question}*`,
      blocks: buildVoteMessage(question, options, endTime),
    });

    if (!message.ts || typeof message.channel !== "string") {
      throw new Error("メッセージの投稿に失敗しました");
    }

    // voteStoreにデータを保存
    voteStore.set(message.ts, {
      channelId: message.channel,
      options,
      votes: new Map(),
      endTime,
    });

    // タイマーをセット
    setTimeout(async () => {
      const voteData = message.ts ? voteStore.get(message.ts) : undefined;
      if (voteData) {
        const results = Array.from(voteData.votes.entries())
          .map(([option, voters]) => ({
            option,
            count: voters.size
          }))
          .sort((a, b) => b.count - a.count);
        
        await client.chat.postMessage({
          channel: channelId,
          text: "投票が終了しました",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*投票結果*\n" + results.map(r => `${r.option}: ${r.count}票`).join("\n")
              }
            }
          ]
        });

        if (message.ts) {
          voteStore.delete(message.ts);
        }
      }
    }, duration * 60 * 1000);
  } catch (error) {
    console.error("投票の作成に失敗しました:", error);
  }
}