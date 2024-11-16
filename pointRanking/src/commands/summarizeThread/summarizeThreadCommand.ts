import { App, SlackCommandMiddlewareArgs } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { fetchThreadMessages } from '../../utils/fetch/fetchThreadMessage';
import { summarizeMessages } from '../../utils/summarizeMessages';

export default function summarizeThreadCommand(app: App) {
  app.command('/summarize_thread', async ({ command, ack, client }: SlackCommandMiddlewareArgs & { client: WebClient }) => {
    await ack();

    const { channel_id, thread_ts, ts, text } = command;

    // thread_tsがない場合、コマンドがスレッド外で実行された可能性
    const target_thread_ts = thread_ts || ts;

    if (!target_thread_ts) {
      await client.chat.postMessage({
        channel: channel_id,
        text: 'このコマンドはスレッド内、またはスレッドのメッセージとして使用してください。',
      });
      return;
    }

    try {
      // スレッド内のメッセージを取得
      const messages = await fetchThreadMessages(client, channel_id, target_thread_ts);
      const summary = await summarizeMessages(messages);

      await client.chat.postMessage({
        channel: channel_id,
        text: `*スレッドの要約*\n${summary}`,
        thread_ts: target_thread_ts, // スレッドに返信として送信
      });
    } catch (error) {
      console.error('要約生成エラー:', error);
      await client.chat.postMessage({
        channel: channel_id,
        text: '要約の生成中にエラーが発生しました。',
        thread_ts: target_thread_ts, // スレッドにエラーを返信
      });
    }
  });
}
