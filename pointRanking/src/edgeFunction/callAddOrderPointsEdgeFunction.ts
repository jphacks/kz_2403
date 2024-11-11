import { callEdgeFunction } from "./callEdgeFunction";

export const callAddOrderPointsEdgeFunction = async (
  serviceRoleKey: string,
  messageId: string,
  reactionUserId: string,
  workspaceId: string
): Promise<any> => {
  const pathKey = "order_points";
  const payload = { messageId, userId: reactionUserId, workspaceId };

  return await callEdgeFunction(pathKey, serviceRoleKey, payload);
};
