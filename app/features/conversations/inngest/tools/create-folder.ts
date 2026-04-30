import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { createTool } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import z from "zod";

interface CreateFilesToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

const paramsSchema = z.object({
  parentId: z.string(),
  name: z.string().min(1, "Folder name is required"),
});
export const createFolderTool = ({
  internalKey,
  projectId,
}: CreateFilesToolOptions) => {
  return createTool({
    name: "createFolder",
    description: "Create folders in the project",
    parameters: z.object({
      name: z.string().describe("The name of the folder to create"),
      parentId: z
        .string()
        .describe(
          "The ID (not name!) of the parent folder from listFiles, or empty string for root level",
        ),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsedData = paramsSchema.safeParse(params);
      if (!parsedData.success) {
        throw new NonRetriableError(
          `Invalid parameters: ${parsedData.error.message}`,
        );
      }
      const { parentId, name } = parsedData.data;
      if (parentId) {
        try {
          const parentFolder = await convex.query(api.system.getFileById, {
            internalKey,
            fileId: parentId as Id<"files">,
          });
          if (!parentFolder) {
            return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
          }
          if (parentFolder.type !== "folder") {
            return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
          }
          const folderId = await convex.mutation(api.system.createFolder, {
            internalKey,
            projectId,
            name,
            parentId: parentId ? (parentId as Id<"files">) : undefined,
          });

          return `Folder created with ID: ${folderId}`;
        } catch {
          return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use empty string for root level.`;
        }
      }
    },
  });
};
