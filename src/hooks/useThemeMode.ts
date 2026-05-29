// 主题模式 hook：根据 meta.theme 与系统 prefers-color-scheme 计算最终是否暗色
// - "light" / "dark" 直接生效
// - "system"（缺省）跟随媒体查询，并在系统切换时实时更新

import { useEffect, useState } from "react";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";

export type ThemeMode = "light" | "dark" | "system";

function getSystemDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useThemeMode(): {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
} {
  const mode = useProfileStore((s) => s.meta.theme ?? "system");
  const { setMeta } = useProfileActions();
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemDark());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = mode === "dark" || (mode === "system" && systemDark);

  // 同步到 <html> data-theme，便于纯 CSS 兜底（body / scrollbar 等）
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    if (isDark) document.body.setAttribute("theme-mode", "dark");
    else document.body.removeAttribute("theme-mode");
  }, [isDark]);

  const setMode = (m: ThemeMode) => setMeta({ theme: m });
  return { mode, isDark, setMode };
}
