import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { createTool } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import z from "zod";

interface DeleteFilesToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "Provide at least one file to delete"),
});
export const deleteFilesTool = ({ internalKey }: DeleteFilesToolOptions) => {
  return createTool({
    name: "deleteFiles",
    description:
      "Delete files or folders from the project. If deleting a folder, all contents will be deleted recursively.",
    parameters: z.object({
      fileIds: z
        .array(z.string().min(1, "File ID cannot be empty"))
        .describe(
          "The ID of the parent folder. Use empty string for root level. Must be a valid folder ID from listFiles.",
        ),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsedData = paramsSchema.safeParse(params);
      if (!parsedData.success) {
        throw new NonRetriableError(
          `Invalid parameters: ${parsedData.error.message}`,
        );
      }
      const { fileIds } = parsedData.data;

      const filesToDelete: {
        id: string;
        name: string;
        type: string;
        parentId: string | null;
      }[] = [];
      for (const fileId of fileIds) {
        const file = await convex.query(api.system.getFileById, {
          internalKey: internalKey,
          fileId: fileId as Id<"files">,
        });
        if (!file) {
          return `Error: The file with ID "${fileId}" Not found. Use listFiles  to get the valid file id .`;
        }
        filesToDelete.push({
          id: file._id,
          name: file.name,
          type: file.type,
          parentId: file.parentId as string | null,
        });
      }

      try {
        return await toolStep?.run("delete-files", async () => {
          const results: string[] = [];
          for (const file of filesToDelete) {
            await convex.mutation(api.system.deleteFile, {
              internalKey: internalKey,
              fileId: file.id as Id<"files">,
            });
            results.push(`Deleted ${file.name} (${file.type})`);
          }
          results.join("\n");
        });
      } catch (error) {
        return `Error creating files: ${error instanceof Error ? error.message : "unknown error "}`;
      }
    },
  });
};
