import { BlockAction, SlackActionMiddlewareArgs } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { PlainTextElement } from "@slack/types";

// 投票の選択肢を追加するハンドラー
export async function handleOptionAddition({
  ack,
  body,
  client,
}: SlackActionMiddlewareArgs<BlockAction> & { client: WebClient }) {
  await ack();

  if (!body.view) {
    console.error("モーダルビューが見つかりません");
    return;
  }

  try {
    const metadata = JSON.parse(body.view.private_metadata);
    const optionCount = metadata.optionCount + 1;

    // 既存のブロックを取得
    const blocks = [...body.view.blocks];
    blocks.pop();

    // 新しい選択肢入力ブロックを追加
    blocks.push({
      type: "input",
      block_id: `vote_option${optionCount}_block`,
      element: {
        type: "plain_text_input",
        action_id: `vote_option${optionCount}`,
        placeholder: {
          type: "plain_text",
          text: `選択肢${optionCount}`,
        } as PlainTextElement,
      },
      label: {
        type: "plain_text",
        text: `選択肢${optionCount}`,
      } as PlainTextElement,
    });

    // 「選択肢を追加」ボタンを再度追加(10個まで)
    blocks.push({
      type: "actions",
      block_id: "add_option_action",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "選択肢を追加",
            emoji: true,
          } as PlainTextElement,
          action_id: "add_option_button",
          ...(optionCount >= 10 ? { style: "danger", disabled: true } : {}),
        },
      ],
    });

    // submit と title が undefined でないことを確認
    const submit = body.view.submit as PlainTextElement;
    const title = body.view.title as PlainTextElement;

    // モーダルを更新
    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: {
        type: "modal",
        callback_id: "vote_modal",
        private_metadata: JSON.stringify({
          ...metadata,
          optionCount,
        }),
        title,
        submit,
        blocks,
      },
    });
  } catch (error) {
    console.error("選択肢追加エラー:", error);
  }
}