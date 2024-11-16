import { useNotion } from "../../../hooks/useNotion";

const notion = useNotion().notion;

export async function fetchNotionPage(pageUrl: string): Promise<string> {
  try {
    // URLからページIDを抽出
    const match = pageUrl.match(/([a-f0-9]{32}|[a-f0-9\-]{36})(?=\?|$)/);
    const rawPageId = match?.[0];

    if (!rawPageId) {
      throw new Error("Invalid Notion page URL");
    }

    // ページIDをUUID形式に変換（必要な場合のみ）
    const pageId =
      rawPageId.includes("-") // すでにUUID形式か確認
        ? rawPageId
        : rawPageId.replace(
            /([a-f0-9]{8})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{12})/,
            "$1-$2-$3-$4-$5"
          );

    if (!pageId.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)) {
      throw new Error("Extracted ID is not a valid UUID");
    }

    // ページの全ブロックを取得
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    // ブロックから文字列を抽出して結合
    const content = response.results
      .map((block: any) => {
        if (block.type === "paragraph" && block.paragraph.rich_text) {
          return block.paragraph.rich_text
            .map((text: any) => text.plain_text)
            .join("");
        }
        return "";
      })
      .filter((text) => text.length > 0)
      .join("\n");

    if (!content) {
      throw new Error("No content found in the page");
    }

    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Notion page: ${error.message}`);
    }
    throw new Error("Failed to fetch Notion page");
  }
}
