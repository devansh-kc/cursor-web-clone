import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { createTool } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import z from "zod";

interface UpdateFilesToolOptions {
  internalKey: string;
}

const paramSchema = z.object({
  fileId: z.string().min(1, "File ID cannot be empty"),
  content: z.string().min(1, "Content cannot be empty"),
});

export const UpdateFilesTool = ({ internalKey }: UpdateFilesToolOptions) => {
  return createTool({
    name: "updateFiles",
    description:
      "Update a file in the project. Returns the updated file details",
    parameters: paramSchema,
    handler: async (parameters, { step }) => {
      const parsedData = paramSchema.safeParse(parameters);
      if (!parsedData.success) {
        throw new NonRetriableError(
          `Invalid parameters: ${parsedData.error.message}`,
        );
      }
      const { fileId, content } = parsedData.data;

      const file = await convex.query(api.system.getFileById, {
        fileId: fileId as Id<"files">,
        internalKey: internalKey,
      });

      if (!file) {
        throw new NonRetriableError(`File with ID ${fileId} not found`);
      }

      if (file.type === "folder") {
        throw new NonRetriableError("Folder cannot be updated");
      }
      try {
        return await step?.run("update-file", async () => {
          await convex.mutation(api.system.updateFile, {
            internalKey: internalKey,
            fileId: fileId as Id<"files">,
            content: content,
          });
          return `File name : ${file?.name} updated successfully`;
        });
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
