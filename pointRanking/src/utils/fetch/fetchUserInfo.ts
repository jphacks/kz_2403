import type { WebClient } from "@slack/web-api";

export const fetchUserInfo = async (client: WebClient, userId: string) => {
  try {
    const userInfo = await client.users.info({ user: userId });
    if (userInfo.user && userInfo.user.profile) {
      return (
        userInfo.user.profile.display_name ||
        "unknown"
      );
    }
  } catch (error) {
    console.error("ユーザー情報取得", error);
  }

  return "unknown_user";
};
