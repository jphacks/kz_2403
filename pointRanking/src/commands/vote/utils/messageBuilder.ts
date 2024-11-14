import type { KnownBlock } from "@slack/web-api";
import { VoteData } from "../types";


export function buildVoteMessage(question: string, options: string[], endTime: number): KnownBlock[] {
  const endTimeDate = new Date(endTime);
  const formattedEndTime = endTimeDate.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${question}*\n終了時刻: ${formattedEndTime}`
      }
    },
    {
      type: "actions",
      block_id: "vote_actions",
      elements: options.map((option, index) => ({
        type: "button",
        text: {
          type: "plain_text",
          text: option,
        },
        value: `vote_option_${index + 1}`,
        action_id: `vote_option_${index + 1}`,
      }))
    }
  ];
}

export function buildVoteResultMessage(
  voteData: VoteData, 
  question: string,
  results: { option: string; count: number; voters: string[] }[]
): KnownBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${question}*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: results
          .map(r => `${r.option}: ${r.count}票 (${r.voters.length}人が投票)`)
          .join('\n'),
      },
    },
    {
      type: "actions",
      block_id: "vote_actions",
      elements: voteData.options.map((option) => ({
        type: "button",
        text: {
          type: "plain_text",
          text: option,
        },
        value: option,
        action_id: `vote_option_${option}`,
      })),
    },
  ];
}