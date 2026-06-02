import { ModuleConfig } from "@/core/registry";

const STORAGE_KEY = "dashboard_hub_layout";

export const storage = {
  saveLayout: (layout: ModuleConfig[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    }
  },
  loadLayout: (): ModuleConfig[] | null => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error("Failed to parse layout from local storage", e);
        }
      }
    }
    return null;
  }
};
