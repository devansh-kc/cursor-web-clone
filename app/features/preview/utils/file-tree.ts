import { Doc, Id } from "@/convex/_generated/dataModel";
import { FileSystemTree } from "@webcontainer/api";
type FileDoc = Doc<"files">;

export function buildFileTree(files: FileDoc[]): FileSystemTree {
  const tree: FileSystemTree = {};
  const fileMap = new Map(files.map((file) => [file._id, file]));
  const getPath = (file: FileDoc): string[] => {
    const parts: string[] = [file.name];
    let parentId = file.parentId;
    while (parentId) {
      const parent = fileMap.get(parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      parentId = parent.parentId;
    }
    return parts;
  };

  for (const file of files) {
    const pathParts = getPath(file);
    let current = tree;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];

      const isLastPart = i === pathParts.length - 1;
      if (isLastPart) {
        if (file.type === "folder") {
          current[part] = { directory: {} };
        } else if (!file.storageId && file.content !== undefined) {
          current[part] = { file: { contents: file.content } };
        }
      } else {
        if (!current[part]) {
          current[part] = { directory: {} };
        }
        const node = current[part];
        if ("directory" in node) {
          current = node.directory;
        } else {
          // This should not happen if the data is consistent
          throw new Error(`Expected ${part} to be a directory`);
        }
      }
    }
  }
  return tree;
}

export const getFilePath = (
  file: FileDoc,
  filesMap: Map<Id<"files">, FileDoc>,
) => {
  const parts: string[] = [file.name];
  let parentId = file.parentId;
  while (parentId) {
    const parent = filesMap.get(parentId);
    if (!parent) break;
    parts.unshift(parent.name);
    parentId = parent.parentId;
  }

  return parts.join("/");
};
