import { Client, GatewayIntentBits, Message } from 'discord.js';
import 'dotenv/config';
import { get } from 'node-emoji';

//botにほしい情報を付与
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

//ボットを起動したときに行われる処理
client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

//新しいメッセージが送られた時に行われる処理
client.on('messageCreate', (message: Message) => {
  // ボットが自分自身に返信しないようにする
  if (message.author.bot) return;

  const emoji = get(':smile:') ?? ''
  // メッセージに返信
  message.react('🤔');
  message.react(emoji);

});

client.login(process.env.DISCORD_TOKEN);

//npx tscしてjs変換してから
//npm run startして実行可能