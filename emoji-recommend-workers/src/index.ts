import type { GoogleKey } from "cloudflare-workers-and-google-oauth";
import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { VisionAIClient } from "./services/vision";

type Env = {
  Bindings: {
    VECTORIZE: VectorizeIndex;
    // Hugging Face + AI Gateway
    HF_API_TOKEN: string;
    CF_ACCOUNT_ID: string;
    CF_AI_GATEWAY_ID: string;
    // Google Cloud Vision API
    GOOGLE_CLOUD_CREDENTIALS: string;
  };
};

const app = new Hono<Env>();

app.get("/ping", (c) => {
  return c.text("pong");
});

app.put("/add-emoji", async (c) => {
  // example: { emoji: "ultrafast-parrot", context: "テンションが高い 楽しい 嬉しい" }
  const { id, emoji, context } = await c.req.json<{
    id: string;
    emoji: string;
    context: string;
  }>();

  const body = JSON.stringify({ inputs: context });

  const response = await fetch(
    `https://gateway.ai.cloudflare.com/v1/${c.env.CF_ACCOUNT_ID}/${c.env.CF_AI_GATEWAY_ID}/huggingface/intfloat/multilingual-e5-large`,
    {
      headers: {
        Authorization: `Bearer ${c.env.HF_API_TOKEN}`,
        ContentType: "application/json",
      },
      method: "POST",
      body: body,
    }
  );

  const embedded: number[] = await response.json();

  await c.env.VECTORIZE.insert([
    { id: id, values: embedded, namespace: "emoji", metadata: { name: emoji } },
  ]);

  return c.json({ data: { id, embedded: embedded } }, 201);
});

app.delete("/emoji", async (c) => {
  const { id } = await c.req.json<{ id: string }>();

  if (!id) {
    return c.json({ error: "Bad Request: id is not defined" }, 400);
  }

  const res = await c.env.VECTORIZE.deleteByIds([id]);

  if (!res) {
    return c.json({ error: "Not Found" }, 404);
  }

  return c.json(204);
})

app.put("/emoji/generate-label", async (c) => {
  const { name, imageUrl } = await c.req.json<{
    name: string;
    imageUrl: string;
  }>();
  if (!name || !imageUrl) {
    return c.json({ error: "Bad Request: name or imageUrl is not defined" }, 400);
  }

  const id = `emoji-${name}`;

  const credentials = JSON.parse(c.env.GOOGLE_CLOUD_CREDENTIALS);

  const visionClient = new VisionAIClient(credentials);

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const analysis = await visionClient.analyzeImage(imageBuffer);
  const labels = analysis.labelAnnotations || [];
  const text = analysis.fullTextAnnotation?.text || "";

  const formattedText = text.replace(/\n/g, "");

  const formattedLabels = labels
    .filter((label) => label.score > 0.8)
    .map((label) => label.description)
    .join(" ");

  const inputs = `${formattedText} ${formattedLabels}`;

  const body = JSON.stringify({ inputs: inputs });
  
  const response = await fetch(
    `https://gateway.ai.cloudflare.com/v1/${c.env.CF_ACCOUNT_ID}/${c.env.CF_AI_GATEWAY_ID}/huggingface/intfloat/multilingual-e5-large`,
    {
      headers: {
        Authorization: `Bearer ${c.env.HF_API_TOKEN}`,
        ContentType: "application/json",
      },
      method: "POST",
      body: body,
    }
  );

  const embedded: number[] = await response.json();

  await c.env.VECTORIZE.insert([
    { id: `emoji-${name}`, values: embedded, namespace: "emoji", metadata: { name: name } },
  ]);

  return c.json({ data: { id, embedded, label: inputs } }, 201);
});

app.post("/recommend", async (c) => {
  try {
    // { id: 投稿ID, text: 投稿内容 }
    const { id, text } = await c.req.json<{ id: string; text: string }>();
    if (!text) {
      return c.json({ error: "Bad Request: text is not defined" }, 400);
    }

    // 文章内のURLを置換
    const replacedText = text.replace(/https?:\/\/\S+/g, "<<URL>>");

    const body = JSON.stringify({
      inputs: replacedText,
    });
    const response = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${c.env.CF_ACCOUNT_ID}/${c.env.CF_AI_GATEWAY_ID}/huggingface/intfloat/multilingual-e5-large`,
      {
        headers: {
          Authorization: `Bearer ${c.env.HF_API_TOKEN}`,
          ContentType: "application/json",
        },
        method: "POST",
        body: body,
      }
    );

    if (!response.ok) {
      return c.json(
        { error: await response.json() },
        response.status as StatusCode
      );
    }

    const embedded: number[] = await response.json();

    // emojiとの類似度を計算
    const result = await c.env.VECTORIZE.query(embedded, {
      topK: 3,
      namespace: "emoji",
      returnMetadata: "all",
    });

    const recommendReactions = result.matches.map((match) => ({
      id: match.id,
      emoji: match?.metadata?.name ?? "",
      score: match.score,
    }));
    return c.json({ recommendReactions }, 200);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error" }, 500);
  }
});

export default app;
