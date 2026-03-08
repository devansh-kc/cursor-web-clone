import { ScrollArea } from "@/components/ui/scroll-area";
import { Id } from "@/convex/_generated/dataModel";
import {
  ChevronRightIcon,
  CopyMinusIcon,
  FilePlusCornerIcon,
  Folder,
  FolderOpen,
  FolderPlusIcon,
  Plus,
} from "lucide-react";
import React, { useState } from "react";
import { useGetProjectById, useProject } from "../../hooks/use-project";
import { Button } from "@/components/ui/button";
import { useCreateFile, useCreateFolder } from "../../hooks/use-files";
import CreateInput from "./create-input";
import { cn } from "@/lib/utils";

function FileExplorer({ projectId }: { projectId: Id<"projects"> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapseKey, setCollapseKey] = useState(0);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const project = useGetProjectById(projectId);
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const handleCreate = (name: string) => {
    setCreating(null);
    if (creating === "file") {
      createFile({ parentId: undefined, name, content: "", projectId });
    } else {
      createFolder({ parentId: undefined, name, projectId });
    }
  };
  return (
    <div className=" h-full bg-sidebar">
      <ScrollArea>
        <div
          role="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
          className="group/project  w-full flex items-center gap-2  hover:bg-accent/30 cursor-pointer font-bold"
        >
          <ChevronRightIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground",
              isOpen && "rotate-90",
            )}
          />
          {isOpen ? (
            <FolderOpen className="size-3.5" />
          ) : (
            <Folder className="size-3.5" />
          )}

          <span className="text-xs  uppercase line-clamp-1">
            {project?.name ?? "loading..."}
          </span>
          <div className="opacity-0 group-hover/project:opacity-100 transistion-none duration-0 flex items-center gap-0.5 ml-auto">
            <Button
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setIsOpen(true);
                setCreating("file");
              }}
              variant={"highlight"}
              size={"icon-xs"}
            >
              <FilePlusCornerIcon className="size-3.5" />
            </Button>
            <Button
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setCreating("folder");
              }}
              variant={"highlight"}
              size={"icon-xs"}
            >
              <FolderPlusIcon className="size-3.5" />
            </Button>
            <Button
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setCollapseKey((prev) => prev + 1);
                setIsOpen(false);
              }}
              variant={"highlight"}
              size={"icon-xs"}
            >
              <CopyMinusIcon className="size-3.5" />
            </Button>
          </div>
        </div>
        {isOpen && (
          <>
            {creating && (
              <CreateInput
                type={creating}
                level={0}
                onSubmit={handleCreate}
                onCancel={() => setCreating(null)}
              />
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}

export default FileExplorer;
