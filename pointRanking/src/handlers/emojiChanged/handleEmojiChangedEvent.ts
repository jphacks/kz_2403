import { load } from "ts-dotenv";
import { ensureEmojiExists } from "../../utils";

const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const env = load({
  WORKERS_API_URL: String,
});

export const handleEmojiChangedEvent = async (
  event: any,
  client: any,
  workspaceId: string
) => {
  console.log("emoji_changed", event);
  console.log("client", client);
  try {
    if (event.subtype !== "add" || !event.value) {
      return;
    }

    const { name: emojiName, value: emojiImageUrl } = event;
    const id = `emoji-${emojiName}`;

    // Workers側に用意してある 画像解析 API を使ってラベルを生成
    const res = await fetch(`${env.WORKERS_API_URL}emoji/generate-label`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: emojiName,
        imageUrl: emojiImageUrl,
      }),
    });
    const label = await res.json();

    console.log("Emoji label generated: ", label.data.label);

    // 生成したラベルをSupabaseに保存
    await ensureEmojiExists(workspaceId, id, emojiName, label.data.label);
  } catch (error) {
    console.error("emoji_changed event error: ", error);
  }
};
