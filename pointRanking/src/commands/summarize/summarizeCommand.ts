import { App } from "@slack/bolt";
import { handleSummarizeCommand } from "./handlers/handleSummarizeCommand";
import { handleSummarizeModalSubmission } from "./handlers/handleSummarizeModalSubmisson";

export default function summarizeCommand(app: App) {
  app.command("/summarize", handleSummarizeCommand);
  app.view("summarize_modal", handleSummarizeModalSubmission);
}