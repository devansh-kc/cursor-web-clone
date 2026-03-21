import { useFile } from "@/app/features/projects/hooks/use-files";
import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { useEditor } from "../../hooks/use-editor";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { FileIcon } from "@react-symbols/icons/utils";
import { XIcon } from "lucide-react";

function Tab({
  fileId,
  isFirst,
  projectId,
}: {
  fileId: Id<"files">;
  isFirst: boolean;
  projectId: Id<"projects">;
}) {
  const file = useFile(fileId);
  const {
    closeTab,
    setActiveTab,
    activeTabId,
    closeAllTabs,
    openFile,
    openTabs,
    previewTabId,
  } = useEditor(projectId);
  const isActive = activeTabId === fileId;
  const isPreview = previewTabId === fileId;
  const fileName = file?.name ?? "Loading...";
  return (
    <div
      onClick={() => setActiveTab(fileId)}
      onDoubleClick={() => openFile(fileId, { pinned: true })}
      className={cn(
        "flex items-center gap-2 h-[35px] pl-2 pr-1.5  cursor-pointer text-muted-foreground group border-y border-x border-transparent hover:bg-accent/30",
        isActive &&
          "bg-background text-foreground border-x-border border-b-background -mb-px drop-shadow",
        isFirst && "border-l-transparent!",
      )}
    >
      {fileName === undefined ? (
        <Spinner className="text-ring" />
      ) : (
        <>
          <FileIcon fileName={fileName} className="size-4" autoAssign />
          <span
            className={cn("text-sm whitespace-nowrap ", isPreview && "italic")}
          >
            {fileName}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeTab(fileId);
            }}
            onKeyDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeTab(fileId);
            }}
            className={cn(
              "p-0.5 rounded-sm hover:bg-white/30 opacity-0 group-hover:opacity-100",
              isActive && "opacity-100",
            )}
          >
            <XIcon className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}

export default Tab;
