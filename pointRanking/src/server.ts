import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import { decorateCommand, rankingCommand } from "./commands";
import { handleMessageEvent, handleReactionAdded } from "./handlers";

(async () => {
  const { slackBot, PORT, workspaceId } = await useSlackbot();
  const { supabase, serviceRoleKey } = useSupabase();

  // コマンドの登録
  rankingCommand(slackBot, supabase);
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
