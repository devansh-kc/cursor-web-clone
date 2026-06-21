import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { createAgent, createTool } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import z from "zod";

interface readFilesProps {
  internalKey: string;
}

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "Provide at least one file ID"),
});

// This tool works like this it will take a internal key and id as param and it will read the code
export const CreateReadFilesTool = ({ internalKey }: readFilesProps) => {
  return createTool({
    name: "read-files",
    description:
      "Read the content of files from the project. Returns file contents.",
    parameters: z.object({
      filesIds: z.array(z.string()).describe("The ids of the files to read"),
    }),
    handler: async (parameters, { step: toolStep }) => {
      const parsedData = paramsSchema.safeParse(parameters);
      if (!parsedData.success) {
        throw new NonRetriableError(
          `Invalid parameters: ${parsedData.error.message}`,
        );
      }

      const { fileIds } = parsedData.data;
      try {
        return await toolStep?.run("read-files", async () => {
          const results: { id: string; name: string; content: string }[] = [];
          for (const fileId of fileIds) {
            const file = await convex.query(api.system.getFileById, {
              internalKey: internalKey,
              fileId: fileId as Id<"files">,
            });

            if (!file) {
              throw new NonRetriableError(`File with ID ${fileId} not found`);
            }

            if (file && file.content) {
              results.push({
                id: fileId,
                name: file.name,
                content: file.content,
              });
            }
          }
          return results;
        });
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
      // fetch files from convetxDb
    },
  });
};
