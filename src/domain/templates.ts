// 一键模板：常见 CSP / CORS / X-Frame / UA / no-cache 预设
// 模板生成的是若干条 HeaderRule，调用方负责 push 到当前 Profile

import { nanoid } from "nanoid";
import type { HeaderRule } from "./models";

export type TemplateKey =
  | "removeCsp"
  | "openCors"
  | "removeXFrame"
  | "customUA"
  | "noCache";

function makeRule(partial: Omit<HeaderRule, "id" | "enabled">): HeaderRule {
  return {
    id: nanoid(),
    enabled: true,
    ...partial,
  };
}

// 模板出厂工厂：每次调用都返回新 id，避免重复模板互相覆盖
export function buildTemplate(key: TemplateKey): HeaderRule[] {
  switch (key) {
    case "removeCsp":
      return [
        makeRule({
          kind: "header",
          target: "response",
          action: "remove",
          name: "Content-Security-Policy",
          value: "",
          condition: { urlFilter: "" },
        }),
        makeRule({
          kind: "header",
          target: "response",
          action: "remove",
          name: "Content-Security-Policy-Report-Only",
          value: "",
          condition: { urlFilter: "" },
        }),
      ];
    case "openCors":
      return [
        makeRule({
          kind: "header",
          target: "response",
          action: "set",
          name: "Access-Control-Allow-Origin",
          value: "*",
          condition: { urlFilter: "" },
        }),
        makeRule({
          kind: "header",
          target: "response",
          action: "set",
          name: "Access-Control-Allow-Methods",
          value: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
          condition: { urlFilter: "" },
        }),
        makeRule({
          kind: "header",
          target: "response",
          action: "set",
          name: "Access-Control-Allow-Headers",
          value: "*",
          condition: { urlFilter: "" },
        }),
        makeRule({
          kind: "header",
          target: "response",
          action: "set",
          name: "Access-Control-Allow-Credentials",
          value: "true",
          condition: { urlFilter: "" },
        }),
      ];
    case "removeXFrame":
      return [
        makeRule({
          kind: "header",
          target: "response",
          action: "remove",
          name: "X-Frame-Options",
          value: "",
          condition: { urlFilter: "" },
        }),
      ];
    case "customUA":
      return [
        makeRule({
          kind: "header",
          target: "request",
          action: "set",
          name: "User-Agent",
          value:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          condition: { urlFilter: "" },
        }),
      ];
    case "noCache":
      return [
        makeRule({
          kind: "header",
          target: "request",
          action: "set",
          name: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
          condition: { urlFilter: "" },
        }),
        makeRule({
          kind: "header",
          target: "request",
          action: "set",
          name: "Pragma",
          value: "no-cache",
          condition: { urlFilter: "" },
        }),
      ];
  }
}

export const TEMPLATE_KEYS: TemplateKey[] = [
  "removeCsp",
  "openCors",
  "removeXFrame",
  "customUA",
  "noCache",
];
