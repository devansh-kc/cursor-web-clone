import React, { useEffect, useMemo, useRef } from "react";

import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { customTheme } from "../extentions/theme";
import { getLanguageExtension } from "../extentions/languages";
import { indentWithTab } from "@codemirror/commands";
import { minimap, minimapTheme } from "../extentions/minimap";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { foldGutter } from "@codemirror/language";
import { customSetup } from "../extentions/custom-setup";
import { suggestion } from "../extentions/suggestions";
import { quickEdit } from "../extentions/quick-edit";
import { SelectionTooltip } from "../extentions/suggestions/selection-tooltip";

interface Props {
  fileName: string;
  initialValue: string;
  onChange: (value: string) => void;
}
function CodeEditor({ fileName, initialValue, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageExtension = useMemo(
    () => getLanguageExtension(fileName),
    [fileName],
  );

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      viewRef.current = new EditorView({
        doc: initialValue,
        parent: editorRef.current,
        extensions: [
          oneDark,
          customTheme,
          customSetup,
          languageExtension,
          minimap(),
          minimapTheme,
          indentationMarkers(),
          suggestion(fileName ?? "Implement this"),
          quickEdit(fileName),
          SelectionTooltip(),
          keymap.of([indentWithTab]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
        ],
      });
    }

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [languageExtension]);
  return <div className="size-full pl-4 bg-background" ref={editorRef} />;
}

export default CodeEditor;
