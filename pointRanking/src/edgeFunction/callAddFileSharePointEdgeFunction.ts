import { callEdgeFunction } from "./callEdgeFunction";

export const callAddFileSharePointsEdgeFunction = async (
  serviceRoleKey: string,
  messageId: string,
  userId: string
): Promise<any> => {
  const pathKey = "file_share_points";
  const payload = { messageId, userId };

  return await callEdgeFunction(pathKey, serviceRoleKey, payload);
};
