import { SlackViewMiddlewareArgs, ViewSubmitAction } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { summarizeText } from "../utils/summarizeText";
import { fetchNotionPage } from "../utils/fetchNotaionPage";

export async function handleSummarizeModalSubmission({
  ack,
  view,
  client,
}: SlackViewMiddlewareArgs<ViewSubmitAction> & { client: WebClient }) {
  await ack();

  const pageUrl = view.state.values.page_url_block.page_url.value;
  if (!pageUrl) {
    throw new Error("NotionページのURLが入力されていません");
  }

  try {
    const pageContent = await fetchNotionPage(pageUrl);
    const summary = await summarizeText(pageContent);

    await client.chat.postMessage({
      channel: view.private_metadata,
      text: `*要約*\n${summary}`,
    });
  } catch (error) {
    console.error("要約処理エラー:", error);
    await client.chat.postMessage({
      channel: view.private_metadata,
      text: "要約処理中にエラーが発生しました。",
    });
  }
}