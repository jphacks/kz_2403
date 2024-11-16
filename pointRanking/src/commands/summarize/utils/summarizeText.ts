import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeText(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: `以下の議事録を読み、タグ、強調表示、色の変更などを確認して重要なポイントを特定し、それを基に3文で要約してください。${text}`,
      },
    ],
    max_tokens: 500,
  });

  if (!response.choices[0]?.message?.content) {
    throw new Error('要約の生成に失敗しました');
  }

  return response.choices[0].message.content.trim();
}