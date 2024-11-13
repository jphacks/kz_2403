import { Client, GatewayIntentBits, Partials, Events, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// リアクションカウントを保存するマップ
const reactionCounts = new Map<string, Map<string, number>>(); // userId -> emoji -> count

// スラッシュコマンドの設定
const commands = [
	new SlashCommandBuilder()
		.setName('ranking')
		.setDescription('Displays the reaction ranking.'),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
			{ body: commands.map(command => command.toJSON()) },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

// ボットの準備完了
client.once('ready', () => {
	console.log(`Logged in as ${client.user?.tag}`);
});

// リアクションが追加されたときのイベント
client.on(Events.MessageReactionAdd, async (reaction, user) => {
	if (reaction.partial) {
		await reaction.fetch();
	}

	const userId = user.id;
	const emoji = (reaction.emoji.name || reaction.emoji.id || 'unknown') as string;

	if (!reactionCounts.has(userId)) {
		reactionCounts.set(userId, new Map());
	}
	const userReactions = reactionCounts.get(userId)!;
	userReactions.set(emoji, (userReactions.get(emoji) || 0) + 1);
});

// リアクションが削除されたときのイベント
client.on(Events.MessageReactionRemove, async (reaction, user) => {
	if (reaction.partial) {
		await reaction.fetch();
	}

	const userId = user.id;
	const emoji = (reaction.emoji.name || reaction.emoji.id || 'unknown') as string;
	const userReactions = reactionCounts.get(userId);
	if (userReactions) {
		const newCount = (userReactions.get(emoji) || 1) - 1;
		if (newCount > 0) {
			userReactions.set(emoji, newCount);
		} else {
			userReactions.delete(emoji);
		}
	}
});

// スラッシュコマンドが実行されたときのイベント
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'ranking') {
		// 全ユーザーのリアクションカウントをまとめ、降順でソートして上位3ユーザーを表示
		const sortedUsers = [...reactionCounts.entries()]
			.map(([userId, reactions]) => ({
				userId,
				count: [...reactions.values()].reduce((acc, val) => acc + val, 0)
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 3);

		// ランキングメッセージを作成
		const rankingMessage = sortedUsers.map((user, index) => {
			const member = interaction.guild?.members.cache.get(user.userId);
			return `${index + 1}. ${member?.user.tag || 'Unknown User'} - ${user.count} reactions`;
		}).join('\n') || 'No reactions to display.';

		await interaction.reply({ content: `**Reaction Ranking:**\n${rankingMessage}`, ephemeral: true });
	}
});

client.login(process.env.DISCORD_TOKEN);

//コマンドを打った人にしか見えない
//完成度低い