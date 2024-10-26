import { Hono } from 'hono'

type Env = {
  Bindings: {
    VECTORIZE: VectorizeIndex
    // Hugging Face + AI Gateway
    HF_API_TOKEN: string
    CF_ACCOUNT_ID: string
    CF_AI_GATEWAY_ID: string
  }
}

const app = new Hono<Env>()

app.get('/ping', (c) => {
  return c.text('pong')
})

// 新しい絵文字とそのEmbeddingを追加するエンドポイント
app.put('/add-emoji', async (c) => {
  // example: { emoji: "ultrafast-parrot", context: "テンションが高い 楽しい 嬉しい" }
  const { id, emoji, context } = await c.req.json<{ id: string, emoji: string; context: string }>();

  const body = JSON.stringify({ inputs: context });
  
  const response = await fetch(`https://gateway.ai.cloudflare.com/v1/${c.env.CF_ACCOUNT_ID}/${c.env.CF_AI_GATEWAY_ID}/huggingface/intfloat/multilingual-e5-large`, {
    headers: {
      Authorization: `Bearer ${c.env.HF_API_TOKEN}`,
      ContentType: "application/json",
    },
    method: "POST",
    body: body,
  })

  const embedded: number[] = await response.json();

  await c.env.VECTORIZE.insert([{ id: id, values: embedded, namespace: 'emoji', metadata: { name: emoji } }]);

  return c.json({ data: { id, embedded: embedded } }, 201);
});

export default app
