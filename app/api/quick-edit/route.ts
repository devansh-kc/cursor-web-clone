import FireCrawlApp from "@/lib/firecrawl/firecrawl";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z as Zod } from "zod";

const quickEditSchema = Zod.object({
  editedCode: Zod.string().describe(
    " The edited code after the AI has made the changes",
  ),
});

const URL_REGEX =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>
<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the edited version of the selected code.
Maintain the same indentation level as the original.
Do not include any explanations or comments unless requested.
If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const { selectedCode, fullCode, instructions } = await request.json();
    if (!userId) {
      return NextResponse?.json(
        {
          error: "Unauthorized",
        },
        { status: 400 },
      );
    }

    if (!selectedCode) {
      return NextResponse?.json(
        {
          error: "Selected code is required",
        },
        { status: 400 },
      );
    }
    if (!instructions) {
      return NextResponse?.json(
        {
          error: "Instructions is required",
        },
        { status: 400 },
      );
    }
    const urls: string[] = instructions?.match(URL_REGEX) || [];
    let documentationContext = "";
    if (urls?.length > 0) {
      const scrapeResults = await Promise.all(
        urls?.map(async (url) => {
          const results = await FireCrawlApp.scrape(url, {
            formats: ["markdown"],
          });
          if (results?.markdown) {
            return results?.markdown;
          } else {
            return null;
          }
        }),
      );

      const validResults = scrapeResults?.filter(Boolean);
      if (validResults.length > 0) {
        documentationContext = `<documentation>n${validResults.join("n\n")}\n</documentation>`;
      }
    }
    const prompt = QUICK_EDIT_PROMPT.replace("{selectedCode}", selectedCode)
      .replace("{fullCode}", fullCode || "")
      .replace("{instruction}", instructions)
      .replace("{documentation}", documentationContext);
    const { output } = await generateText({
      model: google("gemma-3-12b-it"),
      output: Output.object({ schema: quickEditSchema }),
      prompt,
    });
    return NextResponse.json({ editedCode: output.editedCode });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Failed to generate text",
      },

      { status: 500 },
    );
  }
}
