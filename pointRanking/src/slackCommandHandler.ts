
import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import decorateCommand from "./commands/decorateCommand";
import rankingCommand from "./commands/RankingCommand";

const { slackBot, PORT } = useSlackbot();
const { supabase } = useSupabase();

// コマンドの登録
rankingCommand(slackBot, supabase);
decorateCommand(slackBot);

// アプリの起動
(async () => {
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を立ち上げました`);
})();