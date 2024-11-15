import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import {
  decorateCommand,
  questionCommand,
  randomQuestionCommand,
  rankingCommand,
  voteCommand,
} from "./commands";
import { handleMessageEvent, handleReactionAdded } from "./handlers";
import { RandomQuestionScheduler } from "./schedulers/randomQuestionScheduler";

(async () => {
  const { slackBot, slackClient, PORT, workspaceId } = await useSlackbot();
  const { supabase, serviceRoleKey } = useSupabase();

  // コマンドの登録
  rankingCommand(slackBot, supabase, workspaceId);
  decorateCommand(slackBot);
  questionCommand({ slackBot, slackClient });
  voteCommand({ slackBot, slackClient });
  randomQuestionCommand({ slackBot, slackClient });

  const targetChannelId = "C080L8HGB47";
  const scheduler = new RandomQuestionScheduler(slackClient, targetChannelId);
  scheduler.start();

  // イベントハンドラーの登録
  slackBot.event("reaction_added", async ({ event, client }) => {
    await handleReactionAdded(event, client, serviceRoleKey, workspaceId);
  });

  slackBot.event("message", async ({ event, client }) => {
    await handleMessageEvent(event, serviceRoleKey, workspaceId, client);
  });

  // サーバーの起動
  try {
    await slackBot.start(PORT || 3000);
    console.log(`🚀 Server is running on port ${PORT}`);
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
})();
