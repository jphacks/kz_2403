import { useNotion } from "../../../hooks/useNotion";

const notion = useNotion().notion;

export async function fetchNotionPage(pageUrl: string): Promise<string> {
  try {
    // URLからページIDを抽出
    const match = pageUrl.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?=\?|$)/);
    console.log("マッチング結果:", match);
    const rawPageId = match?.[0];

    if (!rawPageId) {
      throw new Error(`NotionのURLが不正です: ${pageUrl}`);
    }

    // ページIDをUUID形式に変換（必要な場合のみ）
    const pageId =
      rawPageId.includes("-") // すでにUUID形式か確認
        ? rawPageId
        : rawPageId.length === 32 // 短い形式の場合
        ? rawPageId.replace(
            /([a-f0-9]{8})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{12})/,
            "$1-$2-$3-$4-$5"
          )
        : null; // 不正な形式の場合はnull

    console.log("ページID:", pageId);

    if (!pageId || !pageId.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)) {
      throw new Error(`ページIDが不正です: ${pageId}`);
    }

    // Notion APIでブロックリストを取得
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    console.log("APIレスポンス:", response);

    if (!response || !response.results || response.results.length === 0) {
      throw new Error(`指定されたページにコンテンツが存在しないか、APIのレスポンスが無効です: ${pageUrl}`);
    }

    // 各ブロックの内容を処理
    const content = response.results
      .map((block: any) => {
        const { type } = block;
        const blockContent = block[type];

        if (blockContent && blockContent.rich_text) {
          const richText = blockContent.rich_text;
          if (richText.length > 0) {
            return richText.map((text: any) => text.plain_text).join("");
          }
        }
        return "";
      })
      .filter((text) => text.length > 0)
      .join("\n");

    if (!content) {
      throw new Error(`ページ内にコンテンツがありません: ${pageUrl}`);
    }

    return content;
  } catch (error) {
    console.error("エラー詳細:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Notion page (${pageUrl}): ${error.message}`);
    }
    throw new Error(`不明なエラーが発生しました: ${pageUrl}`);
  }
}
