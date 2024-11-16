"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageReactionRemoveHandler = void 0;
const useSupabase_1 = require("./hooks/useSupabase");
const userTable = 'D_User';
const messageReactionRemoveHandler = async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        }
        catch (error) {
            console.error('Error fetching reaction:', error);
            return;
        }
    }
    const userId = user.id;
    await updateUserPoints(userId, -1);
};
exports.messageReactionRemoveHandler = messageReactionRemoveHandler;
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
