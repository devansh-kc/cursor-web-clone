import { EditorView } from "@codemirror/view";

export const customTheme = EditorView.theme({
  "&": {
    outline: "none !important",
    height: "100%",
  },
  ".cm-content": {
    padding: "0 !important",
    height: "100%",
    fontFamily: "var(--font-mono), monospace",
    fontSize: "14px",
  },
  ".cm-scroller": {
    scrollbarWidth: "thin",
    scrollbarColor: "var(--sidebar) transparent",
  },
});
