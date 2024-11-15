import type { KnownBlock } from "@slack/web-api";

export function buildQuestionMessage(
  question: string,
  endTime: number
): KnownBlock[] {
  const endTimeDate = new Date(endTime);
  const formattedEndTime = endTimeDate.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*ランダム質問が届きました！*\n${question}\n\n*回答期限*\n${formattedEndTime}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "回答する",
          },
          action_id: "answer_random_question",
        },
      ],
    },
  ];
}
