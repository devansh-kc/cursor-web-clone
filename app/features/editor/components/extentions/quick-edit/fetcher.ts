import { apiFetcher } from "@/utils/api-fetcher-function/api-fetcher-function";
import { z as Zod } from "zod";
import { toast } from "sonner";

const editRequestSchema = Zod.object({
  selectedCode: Zod.string(),
  fullCode: Zod.string(),
  instructions: Zod.string(),
});

const editResponseSchema = Zod.object({
  editedCode: Zod.string(),
});

type EditRequest = Zod.infer<typeof editRequestSchema>;
type EditResponse = Zod.infer<typeof editResponseSchema>;

export const fetcher = async (
  payload: EditRequest,
  abortController: AbortController,
): Promise<string | null> => {
  try {
    const validatePayload = editRequestSchema.parse(payload);
    const response = await apiFetcher({
      url: "/api/quick-edit",
      options: {
        method: "POST",
        body: JSON.stringify(validatePayload),
      },
      timeout: 30000,
      abortSignal: abortController,
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    console.log("Raw response data:", data);
    const validateResponse = editResponseSchema.parse(data);
    console.log(validateResponse);
    return validateResponse.editedCode;
  } catch (error) {
    console.log(error);
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    if (error instanceof Zod.ZodError) {
      console.error("Invalid payload:", error.issues);
    }
    toast.error("Failed to fetch Ai quick-edit");
    return null;
  }
};
