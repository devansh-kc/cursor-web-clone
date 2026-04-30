import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { createTool } from "@inngest/agent-kit";
import z from "zod";

interface RenameFileToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  newName: z.string().min(1, "New name is required"),
});
export const renameFileTool = ({ internalKey }: RenameFileToolOptions) => {
  return createTool({
    name: "renameFile",
    description: "Rename a file in the codebase",
    parameters: z.object({
      fileId: z.string().min(1, "File ID is required"),
      newName: z.string().min(1, "New name is required"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileId, newName } = parsed.data;

      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });

      if (!file) {
        return `Error: File with ID "${fileId}" not found.`;
      }
      try {
        return await toolStep?.run("rename-file", async () => {
          await convex.mutation(api.system.renameFile, {
            internalKey,
            fileId: fileId as Id<"files">,
            name: newName,
          });

          return `Renamed "${file.name}" to "${newName}" successfully`;
        });
      } catch (error) {
        return `Error renaming file: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
