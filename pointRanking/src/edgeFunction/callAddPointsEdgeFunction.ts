import { callEdgeFunction } from "./callEdgeFunction";

export const callAddPointsEdgeFunction = async (
  serviceRoleKey: string,
  messageId: string,
  reactionUserId: string
): Promise<any> => {
  const pathKey = "points_add";
  const payload = { messageId, reactionUserId };

  return await callEdgeFunction(pathKey, serviceRoleKey, payload);
};
