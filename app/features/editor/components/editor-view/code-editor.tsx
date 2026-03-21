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

interface Props {
  fileName: string;
}
function CodeEditor({ fileName }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageExtension = useMemo(
    () => getLanguageExtension(fileName),
    [fileName],
  );

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      viewRef.current = new EditorView({
        doc: `const Counter = () => {
                const [value, setValue] = useState(0);

                const onIncrease = setValue((value) => value +1);

                return (
                    <div> |
                        <button onClick={onIncrease}>{value}</button>
                    </div>
            );`,
        parent: editorRef.current,
        extensions: [
          oneDark,
          customTheme,
          customSetup,
          languageExtension,
          keymap.of([indentWithTab]),
          minimap(),
          minimapTheme,
          indentationMarkers(),
        ],
      });
    }

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);
  return <div className="size-full pl-4 bg-background" ref={editorRef} />;
}

export default CodeEditor;
