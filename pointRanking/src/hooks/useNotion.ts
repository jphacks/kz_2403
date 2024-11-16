import { Client } from "@notionhq/client";

export const useNotion = () => {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  return { notion };
};