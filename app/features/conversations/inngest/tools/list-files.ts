import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { createTool } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import z from "zod";

interface ListFilesToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}
export const createListFilesTool = ({
  projectId,
  internalKey,
}: ListFilesToolOptions) => {
  return createTool({
    name: "listFiles",
    description:
      "List all files and folders in the project. Returns names, IDs, types, and parentId for each item. Items with parentId: null are at root level. Use the parentId to understand the folder structure - items with the same parentId are in the same folder.",
    parameters: z.object({}),
    handler: async () => {
      try {
        const files = await convex.query(api.system.getProjectFiles, {
          internalKey: internalKey,
          projectId: projectId,
        });

        console.log(files);
        if (!files) {
          throw new NonRetriableError(`File with ID ${projectId} not found`);
        }

        const sortedFiles = files.sort((file1, file2) => {
          if (file1.type !== file2.type) {
            return file1.type === "folder" ? -1 : 1;
          }
          return file1.name.localeCompare(file2.name);
        });
        const fileList = sortedFiles.map((file) => ({
          id: file._id,
          name: file.name,
          type: file.type,
          parentId: file.parentId,
        }));

        return fileList;
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
      // fetch files from convetxDb
    },
  });
};
