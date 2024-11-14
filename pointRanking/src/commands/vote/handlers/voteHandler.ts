import { BlockAction, SlackActionMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { voteStore } from "../utils/voteStore";
import { buildVoteResultMessage } from "../utils/messageBuilder";

export async function handleVote({
  ack,
  body,
  action, 
  client,
}: SlackActionMiddlewareArgs<BlockAction> & { client: WebClient }) {
  await ack();

  try {
    const channelId = body.channel?.id;
    const messageTs = body.message?.ts;
    const userId = body.user.id;
    const selectedOption = (action as any).text.text;

    if (!channelId || !messageTs) {
      throw new Error('チャンネルIDまたはメッセージIDが見つかりません');
    }

    // 投票データの取得
    let voteData = voteStore.get(messageTs);

    // 初めての投票の場合、投票データを初期化
    if (!voteData) {
      const message = body.message;
      if (!message?.blocks) {
        throw new Error('メッセージデータが不正です');
      }

      // メッセージから投票オプションを取得
      const options = message.blocks
        .find((block: { type: string }) => block.type === 'actions')
        ?.elements
        ?.map((element: any) => (element as any).text.text) || [];

      voteData = {
        channelId,
        options,
        votes: new Map(),
        endTime: Date.now() + 60 * 60 * 1000 // デフォルト1時間
      };
    }

    // 投票終了チェック
    if (Date.now() > voteData.endTime) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: "この投票は既に終了しています。"
      });
      return;
    }

    // 前回の投票を取り消し（1人1票制）
    for (const [option, voters] of voteData.votes.entries()) {
      voters.delete(userId);
      if (voters.size === 0) {
        voteData.votes.delete(option);
      }
    }

    // 新しい投票を追加
    if (!voteData.votes.has(selectedOption)) {
      voteData.votes.set(selectedOption, new Set());
    }
    voteData.votes.get(selectedOption)?.add(userId);

    // 投票データを更新
    voteStore.set(messageTs, voteData);

    // 投票結果を集計
    const results = Array.from(voteData.votes.entries()).map(([option, voters]) => ({
      option,
      count: voters.size,
      voters: Array.from(voters)
    }));

    // メッセージを更新
    const blocks = buildVoteResultMessage(
      voteData,
      body.message?.blocks?.[0]?.text?.text || '',
      results
    );

    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      blocks,
      text: `投票結果\n${results.map(r => `${r.option}: ${r.count}票`).join('\n')}`
    });

    // 全員が投票完了したかチェック
    const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
    const message = await client.conversations.members({
      channel: channelId
    });

    if (message.members && totalVotes >= message.members.length - 1) { // ボットを除く
      // 全員投票完了
      await client.chat.postMessage({
        channel: channelId,
        thread_ts: messageTs,
        text: "全員の投票が完了しました！"
      });

      // 投票を終了
      voteData.endTime = Date.now();
      voteStore.set(messageTs, voteData);
    }

  } catch (error) {
    console.error('投票処理エラー:', error);
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
      console.error('スタックトレース:', error.stack);
    }
  }
}