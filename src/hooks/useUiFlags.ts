import { useEffect, useMemo, useState } from "react";

const GLASS_UI_OVERRIDE_KEY = "ui:glass";

const parseEnvFlag = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const getStoredOverride = (): boolean | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(GLASS_UI_OVERRIDE_KEY);
  if (!raw) return null;
  if (raw === "on") return true;
  if (raw === "off") return false;
  return null;
};

export const setGlassUiOverride = (value: "on" | "off" | "system") => {
  if (typeof window === "undefined") return;
  if (value === "system") {
    window.localStorage.removeItem(GLASS_UI_OVERRIDE_KEY);
    return;
  }
  window.localStorage.setItem(GLASS_UI_OVERRIDE_KEY, value);
};

export function useUiFlags() {
  const envGlassEnabled = useMemo(
    () => parseEnvFlag(import.meta.env.VITE_ENABLE_GLASS_UI),
    []
  );

  const [glassOverride, setGlassOverride] = useState<boolean | null>(() =>
    getStoredOverride()
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== GLASS_UI_OVERRIDE_KEY) return;
      setGlassOverride(getStoredOverride());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setGlassUiEnabled = (enabled: boolean) => {
    setGlassUiOverride(enabled ? "on" : "off");
    setGlassOverride(enabled);
  };

  const resetGlassUiOverride = () => {
    setGlassUiOverride("system");
    setGlassOverride(null);
  };

  return {
    glassUiEnabled: glassOverride ?? envGlassEnabled,
    setGlassUiEnabled,
    resetGlassUiOverride,
    glassUiOverride: glassOverride,
  };
}
