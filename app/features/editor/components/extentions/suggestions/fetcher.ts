import { apiFetcher } from "@/utils/api-fetcher-function/api-fetcher-function";
import { z as Zod } from "zod";
import { toast } from "sonner";

const suggestionRequestSchema = Zod.object({
  fileName: Zod.string(),
  code: Zod.string(),
  currentLine: Zod.string(),

  previousLines: Zod.string(),
  textBeforeCursor: Zod.string(),
  textAfterCursor: Zod.string(),
  nextLines: Zod.string(),
  lineNumber: Zod.number(),
});

const suggestionResponseSchema = Zod.object({
  suggestion: Zod.string().describe(
    "The code to insert at cursor, or empty string if no completion needed",
  ),
});

type SuggestionRequest = Zod.infer<typeof suggestionRequestSchema>;
type SuggestionResponse = Zod.infer<typeof suggestionResponseSchema>;

export const fetcher = async (
  payload: SuggestionRequest,
  abortController: AbortController,
): Promise<string | null> => {
  try {
    const validatePayload = suggestionRequestSchema.parse(payload);
    const response = await apiFetcher({
      url: "/api/suggestions",
      options: {
        method: "POST",
        body: JSON.stringify(validatePayload),
      },
      timeout: 3,
      abortSignal: abortController,
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const validateResponse = suggestionResponseSchema.parse(data);
    return validateResponse.suggestion;
  } catch (error) {
    console.log(error);
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    if (error instanceof Zod.ZodError) {
      console.error("Invalid payload:", error.issues);
    }
    toast.error("Failed to generate suggestions");
    return null;
  }
};
