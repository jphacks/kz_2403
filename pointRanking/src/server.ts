import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import monthRankingCommand from "./commands/monthRankingCommand";
import totalPointsCommand from "./commands/totalPointsCommand";
import myPointsCommand from "./commands/myPointsCommand";
import decorateCommand from "./commands/decorateCommand";
import { handleReactionAdded } from "./handlers/reactionAddedHandler";
import { handleMessageEvent } from "./handlers/messageHandler";

(async () => {
  const { slackBot, PORT, workspaceId } = await useSlackbot();
  const { supabase, serviceRoleKey } = useSupabase();

  // コマンドの登録
  monthRankingCommand(slackBot, supabase);
  totalPointsCommand(slackBot, supabase);
  myPointsCommand(slackBot, supabase);
  decorateCommand(slackBot);

  // イベントハンドラーの登録
  slackBot.event("reaction_added", async ({ event, client }) => {
    await handleReactionAdded(event, client, serviceRoleKey, workspaceId);
  });

  slackBot.event("message", async ({ event }) => {
    await handleMessageEvent(event, serviceRoleKey, workspaceId);
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