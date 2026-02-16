import { generateText } from "ai";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
export async function POST() {
  const response = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: "How to upskill as a dev",
  });
  return NextResponse.json({ response });
}
