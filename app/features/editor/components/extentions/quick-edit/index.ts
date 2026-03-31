import { EditorView, Tooltip, keymap, showTooltip } from "@codemirror/view";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { fetcher } from "./fetcher";
// StateEffect: A way to send "messages" to update state.
// We define one effect type for setting the suggestion text.
export const showQuickEditEffect = StateEffect.define<boolean>();
let currentAbortController: AbortController | null = null;
let editorView: EditorView | null = null;
export const quickEditState = StateField.define<boolean>({
  create() {
    return false;
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(showQuickEditEffect)) {
        return effect.value;
      }
    }
    if (transaction.selection) {
      const selection = transaction.state.selection.main;
      if (selection.empty) {
        return false;
      }
    }
    return value;
  },
});

const createQuickEditTooltip = (state: EditorState): readonly Tooltip[] => {
  const selection = state.selection.main;
  if (selection.empty) {
    return [];
  }
  const isQuickEditMainActive = state.field(quickEditState);
  if (!isQuickEditMainActive) {
    return [];
  }
  return [
    {
      pos: selection.to,
      above: false,
      strictSide: false,
      create() {
        const dom = document.createElement("div");
        dom.className =
          "bg-popover text-popover-foreground z-50 rounded-sm border border-input p-2 shadow-md flex flex-col gap-2 text-sm";

        const form = document.createElement("form");
        form.className = "flex flex-col gap-2";
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Edit selected code";
        input.className =
          "bg-transparent border-none outline-none px-2 py-1 font-sans w-100";
        input.autofocus = true;
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "flex items-center  justify-between";

        // cancel button to close the tooltip and abort any ongoing request
        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel";
        cancelButton.className =
          "font-sans p-1 px-2 text-muted-foreground rounded hover:text-muted hover:bg-foreground/10 rounded-sm";

        cancelButton.onclick = () => {
          if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
          }
          if (editorView) {
            editorView.dispatch({
              effects: showQuickEditEffect.of(false),
            });
          }
        };
        // cancel button to close the tooltip and abort any ongoing request
        const submitButton = document.createElement("button");
        submitButton.type = "button";
        submitButton.textContent = "Submit";
        submitButton.className =
          "font-sans p-1 px-2 text-muted-foreground rounded hover:text-muted hover:bg-foreground/10 rounded-sm";

        form.onsubmit = async (e) => {
          e.preventDefault();
          if (!editorView) return;
          const instructions = input.value.trim();
          if (!instructions) return;
          const selection = editorView.state.selection.main;
          const selectedText = editorView.state.sliceDoc(
            selection.from,
            selection.to,
          );
          const fullCode = editorView.state.doc.toString();
          submitButton.disabled = true;
          submitButton.textContent = "Loading...";
          currentAbortController = new AbortController();
          const editedCode = await fetcher(
            {
              fullCode: fullCode,
              selectedCode: selectedText,
              instructions: instructions,
            },
            currentAbortController,
          );
          if (editedCode) {
            editorView.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: editedCode,
              },
              selection: {
                anchor: selection.from + editedCode.length,
              },
              effects: showQuickEditEffect.of(false),
            });
          } else {
            submitButton.disabled = false;
            submitButton.textContent = "Submit";
          }
          currentAbortController = null;
        };
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(submitButton);
        form.appendChild(input);
        form.appendChild(buttonContainer);
        dom.appendChild(form);
        setTimeout(() => {
          input.focus();
        }, 0);
        return { dom };
      },
    },
  ];
};

const quickEditTooltip = StateField.define<readonly Tooltip[]>({
  create(state) {
    return createQuickEditTooltip(state);
  },

  update(tooltips, transaction) {
    if (transaction.docChanged || transaction.selection) {
      return createQuickEditTooltip(transaction.state);
    }
    for (const effect of transaction.effects) {
      if (effect.is(showQuickEditEffect)) {
        return createQuickEditTooltip(transaction.state);
      }
    }
    return tooltips;
  },
  provide: (field) =>
    showTooltip.computeN([field], (state) => state.field(field)),
});

const quickEditKeymap = keymap.of([
  {
    key: "Mod-k",
    run: (view) => {
      const selection = view.state.selection.main;
      if (selection.empty) {
        return false;
      }
      view.dispatch({
        effects: showQuickEditEffect.of(true),
      });
      return true;
    },
  },
]);

const captureEditorView = EditorView.updateListener.of((update) => {
  // Handle editor view updates if needed
  editorView = update.view;
});

export const quickEdit = (fileName: string) => [
  quickEditState,
  quickEditTooltip,
  quickEditKeymap,
  captureEditorView,
];
