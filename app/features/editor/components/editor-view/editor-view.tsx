import { Id } from "@/convex/_generated/dataModel";
import React, { useRef } from "react";
import TopNavigation from "./top-navigation";
import { useEditor } from "../../hooks/use-editor";
import FileBreadCrumbs from "./file-bread-crumbs";
import {
  useFile,
  useUpdateFile,
} from "@/app/features/projects/hooks/use-files";
import EmptyEditorState from "./empty-editor-section";
import CodeEditor from "./code-editor";

function EditorView({ projectId }: { projectId: Id<"projects"> }) {
  const { openTabs, activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId as Id<"files">);
  const updateFile = useUpdateFile();
  const timeOutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 1600;
  const isBinaryFile = activeFile && activeFile?.storageId;
  const isActiveFileText = activeFile && !activeFile?.storageId;
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>
      {activeTabId && <FileBreadCrumbs projectId={projectId} />}
      {!activeFile && <EmptyEditorState />}
      {activeFile && (
        <CodeEditor
          fileName={activeFile.name}
          initialValue={activeFile.content || ""}
          onChange={(value) => {
            if (timeOutRef.current) {
              clearTimeout(timeOutRef.current);
            }
            timeOutRef.current = setTimeout(() => {
              updateFile({
                id: activeFile._id,
                content: value,
              });
            }, DEBOUNCE_DELAY);
          }}
        />
      )}
      {isBinaryFile && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Binary file</p>
        </div>
      )}
    </div>
  );
}

export default EditorView;
