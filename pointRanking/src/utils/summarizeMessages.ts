import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const summarizeMessages = async (
  messages: string[]
): Promise<string> => {
  const text = messages.join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `
          以下のメッセージを、カジュアルなトーンで読者が興味を持つように、重要なポイントを押さえて要約してください:
          ${text}
        `,
      },
    ],
    max_tokens: 500,
  });

  if (!response.choices[0]?.message?.content) {
    throw new Error("要約の生成に失敗しました");
  }

  return response.choices[0].message.content.trim();
};
