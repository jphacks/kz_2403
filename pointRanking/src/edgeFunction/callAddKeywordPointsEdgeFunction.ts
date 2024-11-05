import { callEdgeFunction } from "./callEdgeFunction";

export const callAddKeywordPointsEdgeFunction = async (
  serviceRoleKey: string,
  messageId: string,
  reactionUserId: string,
): Promise<any> => {
  const pathKey = "keyword_points";
  const payload = { messageId, reactionUserId };

  return await callEdgeFunction(pathKey, serviceRoleKey, payload);
}