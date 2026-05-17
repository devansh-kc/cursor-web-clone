function getMonacoLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    rb: "ruby",
    php: "php",
    cs: "csharp",
    swift: "swift",
    kt: "kotlin",
  };
  return map[ext || ""] || "plaintext";
}

let abortController: AbortController | null = null;

export function registerInlineCompletions(
  monaco: typeof import("monaco-editor"),
  fileName: string,
) {
  const lang = getMonacoLanguage(fileName);
  monaco.languages.registerInlineCompletionsProvider(lang, {
    provideInlineCompletions: async (model, position) => {
      const code = model.getValue();
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const textAfterCursor = lineContent.substring(position.column - 1);
      const previousLines = model
        .getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber - 1,
          endColumn: 1,
        })
        .slice(0, -1);

      const nextLines: string[] = [];
      const totalLines = model.getLineCount();
      const nextLinesToFetch = Math.min(5, totalLines - position.lineNumber);
      for (
        let i = position.lineNumber + 1;
        i <= position.lineNumber + nextLinesToFetch;
        i++
      ) {
        const line = model.getLineContent(i);
        nextLines.push(line);
      }

      if (!code.trim()) return { items: [] };

      if (abortController) abortController.abort();
      abortController = new AbortController();

      try {
        const response = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            code,
            currentLine: textBeforeCursor,
            previousLines: previousLines || "",
            textBeforeCursor,
            textAfterCursor,
            nextLines: nextLines.join("\n"),
            lineNumber: position.lineNumber,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) return { items: [] };

        const data = await response.json();
        const suggestion = data.suggestion;

        if (!suggestion) return { items: [] };

        return {
          items: [
            {
              insertText: suggestion,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            },
          ],
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return { items: [] };
        }
        console.log("error", error);
        return { items: [] };
      }
    },
    disposeInlineCompletions: () => {
      if (abortController) abortController.abort();
    },
  });
}
