import { callEdgeFunction } from "./callEdgeFunction";

export const callAddTimedPointsEdgeFunction = async (
  serviceRoleKey: string,
  messageId: string,
  reactionUserId: string
): Promise<any> => {
  const pathKey = "timed_points";
  const payload = { messageId, reactionUserId };

  return await callEdgeFunction(pathKey, serviceRoleKey, payload);
};
