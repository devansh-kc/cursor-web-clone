import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  keymap,
} from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";
import { RetryError } from "ai";
import { fetcher } from "./fetcher";
// StateEffect: A way to send "messages" to update state.
// We define one effect type for setting the suggestion text.
const setSuggestionEffect = StateEffect.define<string | null>();
// StateField: Holds our suggestion state in the editor.
// - create(): Returns the initial value when the editor loads
// - update(): Called on every transaction (keystroke, etc.) to potentially update the value
const suggestionState = StateField.define<string | null>({
  create: () => {
    return "/ TODO Implement this";
  },
  update: (value, transaction) => {
    for (const effect of transaction.effects) {
      if (effect.is(setSuggestionEffect)) {
        value = effect.value;
      }
    }
    return value;
  },
});

class SuggestionWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }
  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement("span");
    span.textContent = this.text;
    span.style.opacity = "0.5";
    span.style.pointerEvents = "none";
    span.className = "suggestion";
    return span;
  }
}

let debounceTimer: number | null = null;
let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 700;
let currentAbortController: AbortController | null = null;

const generateFakeSuggestion = (textBeforeCursor: string): string | null => {
  const trimmed = textBeforeCursor.trimEnd();
  if (trimmed.endsWith("const")) return " myVariable = ";
  if (trimmed.endsWith("function")) return " myFunction() {\n \n}";
  if (trimmed.endsWith("console.")) return "log()";
  if (trimmed.endsWith("return")) return " null;";
  return null;
};
const generatePayload = (view: EditorView, fileName: string) => {
  const code = view.state.doc.toString();
  if (!code || code.trim().length === 0) return null;

  const cursor = view.state.selection.main.head;
  const lineAt = view.state.doc.lineAt(cursor);
  const cursorInline = cursor - lineAt.from;

  const textBeforeCursor = view.state.doc.sliceString(lineAt.from, cursor);
  const textAfterCursor = view.state.doc.sliceString(cursor, lineAt.to);

  const previousLines = view.state.doc.sliceString(0, lineAt.from);
  const lastFiveLines: string[] = [];
  const lastFiveLinesToFetch = Math.min(5, lineAt.number - 1);
  for (let i = lastFiveLinesToFetch; i >= 1; i--) {
    const line = view.state.doc.line(i);
    lastFiveLines.push(line.text);
  }

  const nextLines: string[] = [];
  const totalLines = view.state.doc.lines;
  const nextLinesToFetch = Math.min(5, totalLines - lineAt.number);
  for (let i = lineAt.number + 1; i <= nextLinesToFetch; i++) {
    const line = view.state.doc.line(i);
    nextLines.push(line.text);
  }
  return {
    fileName,
    code,
    currentLine: textBeforeCursor,
    previousLines: lastFiveLines?.join("\n"),
    textBeforeCursor,
    textAfterCursor,
    nextLines: nextLines.join("\n"),
    lineNumber: lineAt.number,
  };
};

const createDebouncePlugin = (fileName: string) => {
  return ViewPlugin.fromClass(
    class {
      constructor(view: EditorView) {
        this.triggerSuggestion(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.triggerSuggestion(update.view);
        }
      }
      triggerSuggestion(view: EditorView) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        if (currentAbortController) {
          currentAbortController.abort();
        }
        isWaitingForSuggestion = true;
        debounceTimer = window.setTimeout(async () => {
          const payload = generatePayload(view, fileName);
          if (!payload) {
            isWaitingForSuggestion = false;
            view.dispatch({
              effects: setSuggestionEffect.of(null),
            });
            return;
          }
          currentAbortController = new AbortController();
          try {
            const suggestion = await fetcher(payload, currentAbortController);
            view.dispatch({
              effects: setSuggestionEffect.of(suggestion),
            });
          } catch (error) {
            if (error instanceof RetryError) {
              // retry logic
            }
          }
        }, DEBOUNCE_DELAY);
      }

      destroy() {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        if (currentAbortController) {
          currentAbortController.abort();
        }
      }
    },
  );
};

const renderPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }
    update(update: ViewUpdate) {
      const suggestionsChanged = update.transactions.some(
        (innerTransaction) => {
          return innerTransaction.effects.some((effect) =>
            effect.is(setSuggestionEffect),
          );
        },
      );

      const shouldRebuild =
        update.docChanged || update.selectionSet || suggestionsChanged;
      if (shouldRebuild) {
        this.decorations = this.build(update.view);
      }
    }
    build(view: EditorView) {
      // Get current suggestions from state
      const suggestionText = view.state.field(suggestionState);
      if (!suggestionText) {
        return Decoration.none;
      }
      //create a widget decoration at cursor position

      const cursor = view.state.selection.main.head;
      return Decoration.set([
        Decoration.widget({
          widget: new SuggestionWidget(suggestionText ?? ""),
          side: 1,
        }).range(cursor),
      ]);
    }
  },
  { decorations: (plugins) => plugins.decorations },
);

const acceptSuggestionEffect = keymap.of([
  {
    key: "Tab",
    run: (view) => {
      const suggestionText = view.state.field(suggestionState);

      if (!suggestionText) {
        return false; // Tab will work noramlly
      }

      const cursor = view.state.selection.main.head;
      view.dispatch({
        changes: {
          from: cursor,
          insert: suggestionText,
        },
        selection: {
          anchor: cursor + suggestionText.length, // move cursor after the inserted text
          // head: cursor + suggestionText.length,
        },
        effects: setSuggestionEffect.of(null), // clear the suggestion
      });
      return true;
    },
  },
]);
export const suggestion = (fileName: string) => [
  suggestionState,
  renderPlugin,
  acceptSuggestionEffect,
  createDebouncePlugin(fileName),
];
