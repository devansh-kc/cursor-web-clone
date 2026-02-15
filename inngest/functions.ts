import { generateText } from "ai";
import { inngest } from "./client";
import { google } from "@ai-sdk/google";

export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "test/generate" },
  async ({ event, step }) => {
    await step.run("generate-text", async () => {
      await generateText({
        model: google("gemini-2.5-flash"),
        prompt: "How to upskill as a dev",
      });
    });
  },
);
