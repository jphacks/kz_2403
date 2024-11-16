"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageReactionAddHandler = messageReactionAddHandler;
const useSupabase_1 = require("./hooks/useSupabase");
const emoji = require("emoji-toolkit");
const tableName = "D_Emoji";
const userTable = 'D_User';
async function messageReactionAddHandler(reaction) {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (error) {
            console.error("Error fetching reaction:", error);
            return;
        }
    }
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }
    const user = reaction.users.cache.last();
    if (!user) {
        console.error("No user found for the reaction.");
        return;
    }
    const userId = user.id;
    await updateUserPoints(userId, 1);
    const emojiName = emoji.toShort(`${reaction.emoji.name}`) || reaction.emoji.name;
    const guildId = reaction.message.guild?.id || null;
    const { data, error } = await useSupabase_1.supabase.from(tableName).insert([
        {
            emoji_name: emojiName,
            emoji_id: emojiName,
            workspace_id: guildId,
        },
    ]);
    if (error) {
        console.error("Error saving reaction to Supabase:", error);
    }
    else {
        console.log("Reaction added to Supabase:", data);
    }
}
const updateUserPoints = async (userId, increment) => {
    try {
        const { data, error: fetchError } = await useSupabase_1.supabase
            .from(userTable)
            .select('total_point')
            .eq('user_id', userId)
            .single();
        if (fetchError) {
            console.error('Error fetching user data:', fetchError);
            return;
        }
        if (!data) {
            console.error(`No data found for user_id "${userId}"`);
            return;
        }
        const currentTotalPoints = data.total_point;
        const updatedTotalPoints = currentTotalPoints + increment;
        const { error: updateError } = await useSupabase_1.supabase
            .from(userTable)
            .update({ total_point: updatedTotalPoints })
            .eq('user_id', userId);
        if (updateError) {
            console.error('Error updating user points:', updateError);
        }
        else {
            console.log(`User points updated successfully for user_id "${userId}": ${updatedTotalPoints}`);
        }
    }
    catch (err) {
        console.error('Unexpected error updating user points:', err);
    }
};
