import { Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useRef } from "react";
import TopNavigation from "./top-navigation";
import { useEditor } from "../../hooks/use-editor";
import FileBreadCrumbs from "./file-bread-crumbs";
import {
  useFile,
  useUpdateFile,
} from "@/app/features/projects/hooks/use-files";
import EmptyEditorState from "./empty-editor-section";
import CodeEditor from "./code-editor";
import { useState, useCallback } from "react";
import { Allotment } from "allotment";
import { TerminalIcon, XIcon } from "lucide-react";
import useWebContainer from "@/app/features/preview/hooks/use-webcontainers";
import { PreviewTerminal } from "@/app/features/preview/components/preview-terminal";
function EditorView({
  projectId,
  terminalOutput,
}: Readonly<{
  projectId: Id<"projects">;
  terminalOutput: string;
}>) {
  const [showTerminal, setShowTerminal] = useState(false);
  const toggleTerminal = useCallback(() => {
    setShowTerminal((prev) => !prev);
  }, []);

  const { openTabs, activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId as Id<"files">);
  const updateFile = useUpdateFile();
  const timeOutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 1600;
  const isBinaryFile = activeFile?.storageId;
  const isActiveFileText = activeFile && !activeFile?.storageId;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "`" || e.key === "Backquote")
      ) {
        e.preventDefault();
        toggleTerminal();
      }
    };
    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current);
      }
    };
  }, [activeFile]);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>
      {activeTabId && <FileBreadCrumbs projectId={projectId} />}
      {!activeFile && !showTerminal && <EmptyEditorState />}{" "}
      {(activeFile || showTerminal) && (
        <Allotment vertical>
          <Allotment.Pane minSize={100} preferredSize="70%">
            {activeFile && (
              <CodeEditor
                fileName={activeFile?.name ?? ""}
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
          </Allotment.Pane>
          {showTerminal && (
            <Allotment.Pane minSize={80} preferredSize={200}>
              <div className="h-full flex flex-col bg-background border-t">
                <div className="h-7 flex items-center px-3 text-xs gap-1.5 text-muted-foreground border-b border-border/50 shrink-0">
                  <TerminalIcon className="size-3" />
                  <span className="flex-1">Terminal</span>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
                <PreviewTerminal output={terminalOutput} />
              </div>
            </Allotment.Pane>
          )}
        </Allotment>
      )}
    </div>
  );
}

export default EditorView;
