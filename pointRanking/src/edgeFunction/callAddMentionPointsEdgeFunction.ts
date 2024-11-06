import { callEdgeFunction } from "./callEdgeFunction";

export const callAddMentionPointsEdgeFunction = async (
  serviceRoleKey: string,
  messageId: string,
  reactionUserId: string
): Promise<any> => {
  const pathKey = "mention_points";
  const payload = { messageId, reactionUserId };

  return await callEdgeFunction(pathKey, serviceRoleKey, payload);
};
