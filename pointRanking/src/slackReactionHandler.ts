import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import { handleReactionAdded } from "./handlers/reactionAddedHandler";
import { handleMessageEvent } from "./handlers/messageHandler";

interface MessageEvent {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  event_ts: string;
  channel_type: string;
  files?: Array<{ id: string; name: string; url_private: string }>;
}

(async () => {
  const { slackBot, PORT } = useSlackbot();
  const { serviceRoleKey } = useSupabase();

  slackBot.event("reaction_added", async ({ event, client}) => {
    await handleReactionAdded(event, client, serviceRoleKey);
  })

  slackBot.event("message", async ({ event, client }) => {
    const messageEvent = event as MessageEvent;
    await handleMessageEvent(messageEvent, client, serviceRoleKey);
  });

  // アプリの起動
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を起動しました`);
})();
