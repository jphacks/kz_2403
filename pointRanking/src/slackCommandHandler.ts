
import { useSlackbot } from "./hooks/useSlackbot";
import { useSupabase } from "./hooks/useSupabase";
import monthRankingCommand from "./commands/monthRankingCommand";
import totalPointsCommand from "./commands/totalPointsCommand";
import myPointsCommand from "./commands/myPointsCommand";

const { slackBot, PORT } = useSlackbot();
const { supabase } = useSupabase();

// コマンドの登録
monthRankingCommand(slackBot, supabase);
totalPointsCommand(slackBot, supabase);
myPointsCommand(slackBot, supabase);

// アプリの起動
(async () => {
  await slackBot.start(PORT || 3000);
  console.log(`${PORT}を立ち上げました`);
})();