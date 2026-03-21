import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import TopNavigation from "./top-navigation";
import { useEditor } from "../../hooks/use-editor";
import FileBreadCrumbs from "./file-bread-crumbs";
import { useFile } from "@/app/features/projects/hooks/use-files";
import EmptyEditorState from "./empty-editor-section";
import CodeEditor from "./code-editor";

function EditorView({ projectId }: { projectId: Id<"projects"> }) {
  const { openTabs, activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId as Id<"files">);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>
      {activeTabId && <FileBreadCrumbs projectId={projectId} />}
      {!activeFile && <EmptyEditorState />}
      {activeFile && <CodeEditor fileName={activeFile.name} />}
    </div>
  );
}

export default EditorView;
