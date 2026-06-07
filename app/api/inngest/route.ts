import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processMessage } from "@/app/features/conversations/inngest/process-message";
import { importToGitHub } from "../../features/conversations/inngest/import-to-github";
import { ExportToGithub } from "@/app/features/conversations/inngest/export-to-github";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [importToGitHub, processMessage, ExportToGithub],
});
