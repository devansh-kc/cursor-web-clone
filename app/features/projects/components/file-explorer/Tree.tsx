import { Doc, Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useFolderContents,
  useRenameFile,
} from "../../hooks/use-files";
import TreeItemWrapper from "./tree-item-wrapper";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingRow } from "./loading-row";
import { getItemPadding } from "./constants";
import CreateInput from "./create-input";
import RenameInput from "./rename-input";
import { useEditor } from "../../hooks/use-editor";

function Tree({
  item,
  level,
  projectId,
}: Readonly<{
  item: Doc<"files">;
  level: number;
  projectId: Id<"projects">;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const { openFile, closeTab, activeTabId } = useEditor(projectId);
  const folderContentData = useFolderContents({
    projectId,
    parentId: item._id,
    enable: item.type === "folder" && isOpen,
  });

  const handleRename = (newName: string) => {
    setIsRenaming(false);
    if (newName === item?.name) {
      return;
    }
    renameFile({
      id: item?._id,
      newName,
    });
  };
  const handleCreate = (name: string) => {
    setCreating(null);
    if (creating === "file") {
      createFile({
        projectId,
        name,
        content: "",
        parentId: item?._id,
      });
    } else {
      createFolder({
        name,
        projectId,
        parentId: item?._id,
      });
    }
  };
  const folderName = item?.name;
  const folderRender = (
    <div className="flex items-center gap-0.5">
      <ChevronRightIcon
        className={cn(
          "size-4 shrink-0 text-muted-foreground",
          isOpen && "rotate-90",
        )}
      />
      <FolderIcon folderName={folderName} className="size-4" />
      <span className="truncate text-sm">{folderName}</span>{" "}
    </div>
  );
  if (item.type === "file") {
    const fileName = item?.name;
    const isActive = activeTabId === item._id;

    if (isRenaming) {
      return (
        <RenameInput
          defaultValue={fileName}
          isOpen={isRenaming}
          level={level++}
          onCancel={() => setIsRenaming(false)}
          onSubmit={handleRename}
          type="file"
        />
      );
    }
    return (
      <TreeItemWrapper
        item={item}
        level={level}
        isActive={isActive}
        // projectId={projectId}
        onRename={() => setIsRenaming(true)}
        onDelete={() => {
          closeTab(item._id);
          deleteFile({ fileId: item._id });
        }}
        onCreateFile={() => setCreating("file")}
        onCreateFolder={() => setCreating("folder")}
        onClick={() => openFile(item?._id, { pinned: false })}
        onDoubleClick={() => openFile(item?._id, { pinned: true })}
      >
        <FileIcon fileName={fileName} className="size-4" autoAssign />
        <span className="truncate text-sm">{fileName}</span>
      </TreeItemWrapper>
    );
  }

  if (isRenaming) {
    return (
      <>
        <RenameInput
          defaultValue={folderName}
          type="folder"
          isOpen={isRenaming}
          level={level++}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />
        {isOpen && (
          <>
            {folderContentData === undefined && (
              <LoadingRow level={level + 1} />
            )}

            {folderContentData?.map((subItem) => (
              <Tree
                key={subItem?._id}
                item={subItem}
                level={level++}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </>
    );
  }
  if (creating) {
    return (
      <>
        <button
          onClick={() => setIsOpen((value) => !value)}
          className="group flex items-center gap-1 h-[22px] hover:bg-accent/30 w-full"
          style={{ paddingLeft: getItemPadding(level, false) }}
        >
          {folderRender}
        </button>
        {isOpen && (
          <>
            {folderContentData === undefined && (
              <LoadingRow level={level + 1} />
            )}
            <CreateInput
              type={creating}
              level={level++}
              onSubmit={handleCreate}
              onCancel={() => setCreating(null)}
            />
            {folderContentData?.map((subItem) => (
              <Tree
                key={subItem?._id}
                item={subItem}
                level={level++}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </>
    );
  }
  return (
    <>
      <TreeItemWrapper
        item={item}
        level={level}
        // projectId={projectId}
        onClick={() => setIsOpen((prev) => !prev)}
        onRename={() => setIsRenaming(true)}
        onDelete={() => deleteFile({ fileId: item._id })}
        onCreateFile={() => setCreating("file")}
        onCreateFolder={() => setCreating("folder")}
      >
        {folderRender}
      </TreeItemWrapper>

      {isOpen && (
        <>
          {folderRender == undefined && (
            <p>
              <LoadingRow level={level + 1} />
            </p>
          )}
          {folderContentData?.map((child) => (
            <Tree
              key={child._id}
              item={child}
              level={level + 1}
              projectId={projectId}
            />
          ))}
        </>
      )}
    </>
  );
}

export default Tree;
