import { EditorView, showTooltip, Tooltip } from "@codemirror/view";
import { EditorState, StateField } from "@codemirror/state";
import { quickEditState, showQuickEditEffect } from "../quick-edit";
import { is } from "zod/v4/locales";

let editorView: EditorView | null = null;

const createTooltipForSelection = (state: EditorState): readonly Tooltip[] => {
  const selection = state.selection.main;
  if (selection.empty) {
    return [];
  }
  const isQuickEditActive = state.field(quickEditState);
  if (isQuickEditActive) {
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
          "bg-popover text-popover-foreground z-50 rounded-sm border border-input p-1 shadow-md flex items-center gap-2 text-sm";
        const addToChatButton = document.createElement("button");
        addToChatButton.textContent = "Add to chat";
        addToChatButton.className =
          "font-sans p-1 px-2 hover:bg-foreground/10 rounded-sm";
        const quickEditButton = document.createElement("button");
        quickEditButton.className =
          "font-sans p-1 px-2 hover:bg-foreground/10 rounded-sm text-xs flex items-center gap-1";
        const quickButtonEditText = document.createElement("span");
        quickButtonEditText.textContent = "Quick Edit";
        const quickEditIcon = document.createElement("span");
        quickEditIcon.textContent = "CTRL+K";
        quickEditButton.appendChild(quickButtonEditText);
        quickEditButton.appendChild(quickEditIcon);
        quickEditButton.onclick = () => {
          // Handle quick edit button click
          if (editorView) {
            editorView.dispatch({
              effects: showQuickEditEffect.of(true),
            });
          }
        };
        dom.appendChild(addToChatButton);
        dom.appendChild(quickEditButton);

        return { dom };
      },
    },
  ];
};

const selectionToolTipField = StateField.define<readonly Tooltip[]>({
  create(state) {
    return createTooltipForSelection(state);
  },

  update(tooltips, transaction) {
    if (transaction.docChanged || transaction.selection) {
      return createTooltipForSelection(transaction.state);
    }
    for (const effect of transaction.effects) {
      if (effect.is(showQuickEditEffect)) {
        return createTooltipForSelection(transaction.state);
      }
    }
    return tooltips;
  },
  provide: (field) =>
    showTooltip.computeN([field], (state) => state.field(field)),
});
const captureViewExtention = EditorView.updateListener.of((update) => {
  editorView = update.view;
});
export const SelectionTooltip = () => [
  selectionToolTipField,
  captureViewExtention,
];
