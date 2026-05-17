import type { editor as monacoEditor } from "monaco-editor";

let abortController: AbortController | null = null;
let widget: QuickEditWidget | null = null;

class QuickEditWidget implements monacoEditor.IContentWidget {
  private domNode: HTMLElement;
  private position: monacoEditor.IContentWidgetPosition | null = null;

  constructor(
    private editor: monacoEditor.IStandaloneCodeEditor,
    private monaco: typeof import("monaco-editor"),
  ) {
    this.domNode = document.createElement("div");
    this.domNode.className =
      "bg-popover text-popover-foreground z-50 rounded-sm border border-input p-2 shadow-md flex flex-col gap-2 text-sm";

    const form = document.createElement("form");
    form.className = "flex flex-col gap-2";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Edit selected code";
    input.className =
      "bg-transparent border-none outline-none px-2 py-1 font-sans w-80";

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex items-center justify-between";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.className =
      "font-sans p-1 px-2 text-muted-foreground rounded hover:text-muted hover:bg-foreground/10";

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Submit";
    submitBtn.className =
      "font-sans p-1 px-2 text-muted-foreground rounded hover:text-muted hover:bg-foreground/10";

    cancelBtn.onclick = () => this.close();
    form.onsubmit = (e) => this.handleSubmit(e, input, submitBtn);

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(submitBtn);
    form.appendChild(input);
    form.appendChild(buttonContainer);
    this.domNode.appendChild(form);

    setTimeout(() => input.focus(), 0);
  }

  getId() {
    return "quick-edit-widget";
  }

  getDomNode() {
    return this.domNode;
  }

  getPosition() {
    const selection = this.editor.getSelection();
    if (!selection) return null;
    return {
      position: {
        lineNumber: selection.positionLineNumber,
        column: selection.positionColumn,
      },
      preference: [
        this.monaco.editor.ContentWidgetPositionPreference.BELOW,
        this.monaco.editor.ContentWidgetPositionPreference.ABOVE,
      ],
    };
  }

  private async handleSubmit(
    e: Event,
    input: HTMLInputElement,
    submitBtn: HTMLButtonElement,
  ) {
    e.preventDefault();
    const instructions = input.value.trim();
    if (!instructions) return;

    const selection = this.editor.getSelection();
    if (!selection || selection.isEmpty()) return;

    const selectedText =
      this.editor.getModel()?.getValueInRange(selection) || "";
    const fullCode = this.editor.getValue();

    submitBtn.disabled = true;
    submitBtn.textContent = "Loading...";

    abortController = new AbortController();

    try {
      const response = await fetch("/api/quick-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCode: selectedText, fullCode, instructions }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
        return;
      }

      const data = await response.json();
      const editedCode = data.editedCode;

      if (editedCode) {
        this.editor.executeEdits("quick-edit", [
          {
            range: selection,
            text: editedCode,
          },
        ]);
        this.close();
      } else {
        this.close();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.log("error", error);
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  }

  private close() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    this.editor.removeContentWidget(this);
    widget = null;
  }
}

export function registerQuickEdit(
  editor: monacoEditor.IStandaloneCodeEditor,
  monaco: typeof import("monaco-editor"),
) {
  editor.addAction({
    id: "quick-edit",
    label: "Quick Edit with AI",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
    precondition: "editorHasSelection",
    run: () => {
      if (widget) {
        editor.removeContentWidget(widget);
        widget = null;
        return;
      }
      widget = new QuickEditWidget(editor, monaco);
      editor.addContentWidget(widget);
    },
  });
}
