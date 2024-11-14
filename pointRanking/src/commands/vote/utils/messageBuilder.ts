import type { KnownBlock } from "@slack/web-api";
import { VoteData } from "../types";


export function buildVoteMessage(question: string, options: string[], endTime: number): KnownBlock[] {
  const remainingTime = Math.max(0, endTime - Date.now());
  const remainingMinutes = Math.floor(remainingTime / (1000 * 60));

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${question}*\n残り時間: ${remainingMinutes}分`
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
  ]
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