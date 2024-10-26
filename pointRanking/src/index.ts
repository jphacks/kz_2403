import { useSlackbot } from "./hooks/useSlackbot"

(async () => {
  const { slackbot, PORT } = useSlackbot();
  console.log(`Slackbot initialized with PORT: ${PORT}`);

  slackbot.message('', async ({ message, say }) => {
    console.log('Message event received');
    if (!message.subtype) {
      await say(`お前は次に${message.text}という`);
    }
  });

  try {
    await slackbot.start(PORT);
    console.log(`${PORT}ポートを立ち上げました`);
  } catch (error) {
    console.error('Failed to start slackbot:', error);
  }
})();