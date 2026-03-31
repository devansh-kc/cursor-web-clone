import { EditorView } from "@codemirror/view";
import { showMinimap } from "@replit/codemirror-minimap";

export const minimap = () => {
  const miniMapDom = (miniMap: EditorView) => {
    const dom = document.createElement("div");

    // Size
    dom.style.width = "80px";

    // Background to match editor
    dom.style.background = "#1e1e1e";

    // Subtle border separator
    dom.style.borderLeft = "1px solid #333";

    // Smooth scrolling
    dom.style.overflow = "hidden";
    dom.style.scrollBehavior = "smooth";

    return { dom };
  };

  return showMinimap.compute(["doc"], (state) => {
    return {
      create: miniMapDom,

      // "blocks" groups lines visually — good for large files
      // alternatives: "characters" (shows actual text, more detailed)
      displayText: "blocks",

      // "always" keeps overlay visible — easier to track position
      // alternatives: "mouse-over" (only shows on hover — cleaner look)
      showOverlay: "mouse-over",

      // Gutters: map line numbers to indicator colors
      // Great for showing errors, warnings, git changes
      gutters: [
        { 1: "#ff5555", 2: "#ff5555" }, // 🔴 errors
        { 1: "#ffaa00", 2: "#ffaa00" }, // 🟡 warnings
        { 1: "#50fa7b", 2: "#50fa7b" }, // 🟢 success / git added
      ],
    };
  });
};

export const minimapTheme = EditorView.theme({
  // Viewport box (shows current scroll position)
  ".cm-minimap-viewport": {
    background: "rgba(100, 149, 237, 0.15)",
    border: "1px solid rgba(100, 149, 237, 0.5)",
    borderRadius: "2px",
    boxShadow: "0 0 6px rgba(100, 149, 237, 0.2)",
    transition: "background 0.2s ease",
  },

  // Hover effect on viewport
  ".cm-minimap-viewport:hover": {
    background: "rgba(100, 149, 237, 0.25)",
    cursor: "pointer",
  },

  // Minimap outer container
  ".cm-minimap": {
    opacity: "0.85",
    transition: "opacity 0.2s ease",
  },

  // Slightly more visible on hover
  ".cm-minimap:hover": {
    opacity: "1",
  },
});
