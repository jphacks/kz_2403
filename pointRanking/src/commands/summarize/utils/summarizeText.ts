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
        content: `
        以下の議事録を詳細に分析し、以下の手順に基づいて重要な情報を抽出してください。

        1. **主要な議論のトピック**: 会議中で話し合われた主なテーマや議題をリストアップしてください。
        2. **重要な発言とその背景**: 重要な発言や意思決定の背景を簡潔にまとめてください。
        3. **次のアクション**: 会議後に行うべきアクションやタスクを明確に列挙してください。
        4. **課題と提案**: 話し合いの中で挙げられた課題と、それに対する提案を要約してください。
        5. **参加者別の意見**: 可能であれば、主要な参加者ごとの意見やコメントを要約してください。

        以下の議事録を基に、上記の形式で要約を作成してください。
        議事録内容:
        ${text}
        `,
      },
    ],
    max_tokens: 500,
  });

  if (!response.choices[0]?.message?.content) {
    throw new Error('要約の生成に失敗しました');
  }

  return response.choices[0].message.content.trim();
}