import React, { useCallback, useRef } from "react";

import { useTheme } from "next-themes";
import Editor, { OnMount } from "@monaco-editor/react";
import { registerInlineCompletions } from "../extentions/suggestions/monaco/inline-completions";
import { registerQuickEdit } from "../extentions/suggestions/monaco/quick-edit";

interface Props {
  fileName: string;
  initialValue: string;
  onChange: (value: string) => void;
}

function getLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    html: "html",
    css: "css",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    rb: "ruby",
    php: "php",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sql: "sql",
    sh: "shell",
    bash: "shell",
  };
  return map[ext || ""] || "plaintext";
}
function CodeEditor({ fileName, initialValue, onChange }: Readonly<Props>) {
  const { resolvedTheme } = useTheme();
  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      registerInlineCompletions(monaco, fileName);
      registerQuickEdit(editor, monaco);
    },
    [fileName],
  );
  const language = getLanguage(fileName);

  return (
    <Editor
      height="100%"
      language={language}
      defaultValue={initialValue}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      onChange={(val) => onChange(val ?? "")}
      onMount={handleMount}
      options={{
        inlineSuggest: { enabled: true },
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: "on",
        automaticLayout: true,
        wordWrap: "off",
        tabSize: 2,
        scrollBeyondLastLine: false,
        padding: { top: 8 },
      }}
    />
  );
}

export default CodeEditor;
