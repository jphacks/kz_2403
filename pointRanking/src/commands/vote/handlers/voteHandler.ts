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
  // 早めにackを呼び出す
  await ack();

  try {
    const channelId = body.channel?.id;
    const messageTs = body.message?.ts;
    const userId = body.user.id;
    const selectedOption = (action as any).text.text;

    if (!channelId || !messageTs) {
      console.error('チャンネルIDまたはメッセージIDが見つかりません');
      return;
    }

    // 投票データの取得
    let voteData = voteStore.get(messageTs);
    
    // 投票データが存在しない場合の処理
    if (!voteData) {
      console.error('投票データが見つかりません');
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: "申し訳ありません。この投票は既に終了しているか、データが見つかりません。"
      });
      return;
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

    // 結果を集計
    const results = Array.from(voteData.votes.entries())
      .map(([option, voters]) => ({
        option,
        count: voters.size,
        voters: Array.from(voters)
      }));

    // メッセージを更新
    try {
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        blocks: buildVoteResultMessage(voteData, body.message?.blocks?.[0]?.text?.text || '', results),
        text: `投票結果\n${results.map(r => `${r.option}: ${r.count}票`).join('\n')}`
      });
    } catch (updateError) {
      console.error('メッセージ更新エラー:', updateError);
    }

  } catch (error) {
    console.error('投票処理エラー:', error);
    // エラーが発生しても、ackは既に送信済みなのでSlackへの応答は保証される
    try {
      await client.chat.postEphemeral({
        channel: body.channel?.id || '',
        user: body.user.id,
        text: "投票処理中にエラーが発生しました。しばらく待ってから再度お試しください。"
      });
    } catch (notifyError) {
      console.error('エラー通知の送信に失敗:', notifyError);
    }
  }
}