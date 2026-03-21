import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useFile(fileId: Id<"files">) {
  return useQuery(api.files.getFileById, fileId ? { id: fileId } : "skip");
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
export function useRenameFile() {
  return useMutation(api.files.renameFile);
}
export function useDeleteFile() {
  return useMutation(api.files.deleteFile);
}
