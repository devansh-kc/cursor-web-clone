import { Id } from "@/convex/_generated/dataModel";
import { create } from "zustand";

interface TabStates {
  openTabs: Id<"files">[];
  activeTabId: Id<"files"> | null;
  previewTabId: Id<"files"> | null;
}

const defaultTabStates: TabStates = {
  openTabs: [],
  activeTabId: null,
  previewTabId: null,
};
interface EditorStore {
  tabs: Map<Id<"projects">, TabStates>;
  getTabState: (projectId: Id<"projects">) => TabStates;
  openFile: (
    projectId: Id<"projects">,
    fileId: Id<"files">,
    option: { pinned: boolean },
  ) => void;
  closeAllTabs: (projectId: Id<"projects">) => void;
  closeTab: (projectId: Id<"projects">, fileId: Id<"files">) => void;
  setActiveTab: (projectId: Id<"projects">, fileId: Id<"files">) => void;
}

export const useEditorStore = create<EditorStore>()((set, get) => ({
  tabs: new Map(),
  getTabState: (projectId) => {
    return get().tabs.get(projectId) ?? defaultTabStates;
  },
  openFile: (projectId, fileId, { pinned }) => {
    const tabs = new Map(get().tabs);
    const state = tabs.get(projectId) ?? defaultTabStates;
    const { openTabs, previewTabId } = state;
    const isOpen = openTabs.includes(fileId);

    // case one opening as preview
    if (!isOpen && !pinned) {
      const newTabs = previewTabId
        ? openTabs?.map((id) => (id === previewTabId ? fileId : id))
        : [...openTabs, fileId];

      tabs.set(projectId, {
        openTabs: newTabs,
        activeTabId: fileId,
        previewTabId: fileId,
      });
      set({ tabs });
      return;
    }
    // case 2 opening as pinned  -- add new tab
    if (!isOpen && pinned) {
      tabs.set(projectId, {
        ...state,
        openTabs: [...openTabs, fileId],
        activeTabId: fileId,
      });
      set({ tabs });
      return;
    }
    // Case 3 opening already open tab
    const shouldPin = pinned && previewTabId === fileId;
    tabs.set(projectId, {
      ...state,
      activeTabId: fileId,
      previewTabId: shouldPin ? null : previewTabId,
    });
    set({ tabs });
  },

  closeTab: (projectId, fileId) => {
    const tabs = new Map(get().tabs);
    const state = tabs.get(projectId) ?? defaultTabStates;
    const { activeTabId, openTabs, previewTabId } = state;
    const tabIndex = openTabs.indexOf(fileId);

    if (tabIndex === -1) return;
    const newTabs = openTabs.filter((id) => id !== fileId);
    let newActiveTabId = activeTabId;
    // If the closed tab was the active tab, activate the previous tab in the list;
    // if there's no previous tab, fall back to the first remaining tab, or null if none remain.
    if (activeTabId === fileId) {
      if (tabIndex === 0) {
        newActiveTabId = newTabs[0] ?? null;
      } else if (tabIndex >= newTabs?.length) {
        newActiveTabId = newTabs[newTabs?.length - 1] ?? null;
      } else {
        newActiveTabId = newTabs[tabIndex];
      }
    }
    tabs.set(projectId, {
      openTabs: newTabs,
      activeTabId: newActiveTabId,
      previewTabId: previewTabId === fileId ? null : previewTabId,
    });

    set({ tabs });
  },
  closeAllTabs: (projectId) => {
    const tabs = new Map(get().tabs);
    tabs.set(projectId, defaultTabStates);
    set({ tabs });
  },
  setActiveTab: (projectId, fileId) => {
    const tabs = new Map(get().tabs);
    const state = tabs.get(projectId) ?? defaultTabStates;
    tabs.set(projectId, {
      ...state,
      activeTabId: fileId,
      previewTabId: state.previewTabId === fileId ? null : state.previewTabId,
    });
    set({ tabs });
  },
}));
