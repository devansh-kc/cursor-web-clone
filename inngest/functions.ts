import { generateText } from "ai";
import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import FireCrawlApp from "@/lib/firecrawl/firecrawl";

const URL_REGEX =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "test/generate" },
  async ({ event, step }) => {
    const { prompt } = event.data as { prompt: string };
    const urls = (await step.run("extract-urls", async () => {
      return prompt.match(URL_REGEX) ?? [];
    })) as string[];
    const scrapedContent = await step.run("scrape-urls", async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await FireCrawlApp.scrape(url, {
            formats: ["markdown"],
          });
          return result?.markdown ?? null;
        }),
      );
      results?.filter(Boolean)?.join("\n\n");
    });
    const finalContent = scrapedContent
      ? `Context:\n${scrapedContent}\n\nQuestion: ${prompt}`
      : prompt;
    await step.run("generate-text", async () => {
      await generateText({
        model: google("gemini-2.5-flash"),
        prompt: finalContent,
      });
    });
  },
);
