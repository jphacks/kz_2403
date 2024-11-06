import { useSlackbot } from "./hooks/useSlackbot";

(async () => {
  const { slackBot, PORT } = useSlackbot();
  console.log(`Slackbot initialized with PORT: ${PORT}`);

  slackBot.message("", async ({ message, say }) => {
    console.log("Message event received");
    if (!message.subtype) {
      await say(`お前は次に${message.text}という`);
    }
  });

  try {
    await slackBot.start(PORT);
    console.log(`${PORT}ポートを立ち上げました`);
  } catch (error) {
    console.error("Failed to start slackbot:", error);
  }
})();
