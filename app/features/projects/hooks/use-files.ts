import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useFile(fileId: Id<"files">) {
  return useQuery(api.files.getFileById, fileId ? { id: fileId } : "skip");
}

export function useFiles(projectId: Id<"projects"> | null) {
  return useQuery(api.files.getFiles, projectId ? { projectId } : "skip");
}

export function useFilePath(fileId: Id<"files">) {
  return useQuery(api.files.getFilePath, fileId ? { fileId: fileId } : "skip");
}

export function useFolderContents({
  projectId,
  parentId,
  enable = true,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enable?: boolean;
}) {
  return useQuery(
    api.files.getFolderContents,
    enable
      ? {
          projectId: projectId,
          parentId,
        }
      : "skip",
  );
}

export function useCreateFile() {
  return useMutation(api.files.createFile);
}

export function useCreateFolder() {
  return useMutation(api.files.createFolder);
}
export function useUpdateFile() {
  return useMutation(api.files.updateFile);
}

const sortFiles = <T extends { type: "file" | "folder"; name: string }>(
  files: T[],
): T[] => {
  return [...files].sort((a, b) => {
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
};

export function useRenameFile({
  projectId,
  parentId,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
}) {
  return useMutation(api.files.renameFile).withOptimisticUpdate(
    (localStore, args) => {
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
      });
      if (existingFiles !== undefined && existingFiles !== null) {
        const updatedFiles = existingFiles.map((files) =>
          files?._id === args?.id ? { ...files, name: args.newName } : files,
        );
        localStore.setQuery(
          api.files.getFolderContents,
          { projectId, parentId },
          sortFiles(updatedFiles),
        );
      }
    },
  );
}
export const useDeleteFile = ({
  projectId,
  parentId,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
}) => {
  return useMutation(api.files.deleteFile).withOptimisticUpdate(
    (localStore, args) => {
      const existingFiles = localStore.getQuery(api.files.getFolderContents, {
        projectId,
        parentId,
      });
      if (existingFiles !== undefined) {
        localStore.setQuery(
          api.files.getFolderContents,
          { projectId, parentId },
          existingFiles?.filter((file) => file._id !== args?.fileId),
        );
      }
    },
  );
};
