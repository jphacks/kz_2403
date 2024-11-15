import { callEdgeFunction } from "./callEdgeFunction";

export const callAddMentionPointsEdgeFunction = async (
  serviceRoleKey: string,
  messageId: string,
  messageUserId: string
): Promise<any> => {
  const pathKey = "mention_points";
  const payload = { messageId, messageUserId };

  return await callEdgeFunction(pathKey, serviceRoleKey, payload);
};
