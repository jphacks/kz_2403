export const callEdgeFunction = async (
  edgeFunctionUrl: string,
  serviceRoleKey: string,
  messageId: string,
  reactionUserId: string
) => {
  try {
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ messageId, reactionUserId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Edge Functionエラー:", errorData);
    } else {
      const data = await response.json();
      console.log("Edge Function呼び出し成功:", data);
    }
  } catch (error) {
    console.error("Edge Functionの呼び出しエラー:", error);
  }
};