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

app.post('/recommend', async (c) => {
  try {
    // { id: 投稿ID, text: 投稿内容 }
    const { id, text } = await c.req.json<{ id: string, text: string }>();
    if (!text) {
      return c.json({ error: 'Bad Request: text is not defined' }, 400);
    }

    const body = JSON.stringify({ input: text });
    const response = await fetch(`https://gateway.ai.cloudflare.com/v1/${c.env.CF_ACCOUNT_ID}/${c.env.CF_AI_GATEWAY_ID}/huggingface/intfloat/multilingual-e5-large`, {
      headers: {
				Authorization: `Bearer ${c.env.HF_API_TOKEN}`,
				ContentType: "application/json",
			},
			method: "POST",
			body: body,
    })
    
    const embedded: number[] = await response.json();
    
    // emojiとの類似度を計算
    const result = await c.env.VECTORIZE.query(embedded, {
      topK: 3,
      namespace: 'emoji',
      returnMetadata: "all",
    })
    
    await c.env.VECTORIZE.insert([{ id: id, values: embedded, namespace: 'message' }]);

    const recommendReactions = result.matches.map((match) => (
      {
        id: match.id,
        emoji: match?.metadata?.name ?? '',
        score: match.score,
      }
    ))
    return c.json({ recommendReactions }, 200);
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Error' }, 500);
  }
})

export default app
