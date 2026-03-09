import { Doc, Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useFolderContents,
  useRenameFile,
} from "../../hooks/use-files";

function Tree({
  item,
  level,
  projectId,
}: {
  item: Doc<"files">;
  level: number;
  projectId: Id<"projects">;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const folderContent = useFolderContents({
    projectId,
    parentId: item._id,
    enable: item.type === "folder" && isOpen,
  });

  return <div>Tree</div>;
}

export default Tree;
