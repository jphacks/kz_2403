import { buildEdgeUrl } from "./buildEdgeUrl";

export const callEdgeFunction = async (
  pathKey: string,
  serviceRoleKey: string,
  messageId: string,
  reactionUserId: string
): Promise<EdgeFunctionResponse | null> => {
  try {
    const edgeFunctionUrl = buildEdgeUrl(pathKey);
    const url = new URL(edgeFunctionUrl);
    url.searchParams.set('apikey', serviceRoleKey);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      },
      body: JSON.stringify({ messageId, reactionUserId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Edge Functionエラー:", data);
      return null;
    }

    console.log("Edge Function呼び出し成功:", data);
    return data;
  } catch (error) {
    console.error("Edge Functionの呼び出しエラー:", error);
    return null;
  }
};