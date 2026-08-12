// 行内字段历史值：从所有 Profile 的 rules 中收集出现过的 name/value
// 用于 AntD AutoComplete 下拉建议；纯派生，无需额外持久化。

import { useMemo } from "react";
import { useProfileStore } from "@/src/application/profile-store";

export interface HistorySuggestions {
  names: string[];
  valuesByName: Map<string, string[]>;
}

// 常见请求/响应头作为零规则时的兜底建议
const COMMON_HEADERS = [
  "User-Agent",
  "Authorization",
  "Cookie",
  "Referer",
  "Origin",
  "Accept",
  "Accept-Language",
  "Cache-Control",
  "Content-Type",
  "X-Requested-With",
  "X-Forwarded-For",
  "Access-Control-Allow-Origin",
  "Access-Control-Allow-Methods",
  "Access-Control-Allow-Headers",
  "Access-Control-Allow-Credentials",
  "Set-Cookie",
  "Content-Security-Policy",
  "X-Frame-Options",
  "Strict-Transport-Security",
];

export function useHistorySuggestions(): HistorySuggestions {
  const profiles = useProfileStore((s) => s.profiles);

  return useMemo(() => {
    const names = new Set<string>(COMMON_HEADERS);
    const valuesByName = new Map<string, Set<string>>();

    for (const p of profiles) {
      for (const r of p.rules) {
        const n = r.name?.trim();
        if (!n) continue;
        names.add(n);
        if (r.value) {
          const set = valuesByName.get(n) ?? new Set<string>();
          set.add(r.value);
          valuesByName.set(n, set);
        }
      }
    }

    return {
      names: Array.from(names).sort((a, b) => a.localeCompare(b)),
      valuesByName: new Map(
        Array.from(valuesByName.entries()).map(([k, v]) => [
          k,
          Array.from(v).sort((a, b) => a.localeCompare(b)),
        ]),
      ),
    };
  }, [profiles]);
}
