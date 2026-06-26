import { ModuleConfig } from "@/core/registry";

const STORAGE_KEY = "dashboard_hub_layout";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalNumber(value: unknown) {
  return value === undefined || typeof value === "number";
}

function isModuleConfig(value: unknown): value is ModuleConfig {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    isOptionalNumber(value.x) &&
    isOptionalNumber(value.y) &&
    isOptionalNumber(value.w) &&
    isOptionalNumber(value.h) &&
    (value.hidden === undefined || typeof value.hidden === "boolean") &&
    (value.props === undefined || isRecord(value.props))
  );
}

export const storage = {
  saveLayout: (layout: ModuleConfig[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      } catch (e) {
        console.error("Failed to save layout to local storage", e);
      }
    }
  },
  loadLayout: (): ModuleConfig[] | null => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        try {
          const parsed: unknown = JSON.parse(data);
          return Array.isArray(parsed) && parsed.every(isModuleConfig) ? parsed : null;
        } catch (e) {
          console.error("Failed to parse layout from local storage", e);
        }
      }
    }
    return null;
  }
};
