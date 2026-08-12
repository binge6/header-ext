import type { HeaderAction, ResourceType } from "@/src/domain";

export const ACTION_OPTIONS: HeaderAction[] = ["set", "append", "remove"];

export const ACTION_SYMBOLS: Record<HeaderAction, string> = {
  set: "=",
  append: "+",
  remove: "-",
};

export const RESOURCE_TYPES: ResourceType[] = [
  "main_frame",
  "sub_frame",
  "xmlhttprequest",
  "script",
  "stylesheet",
  "image",
  "font",
  "media",
  "websocket",
  "ping",
  "other",
];

// DNR 支持的 HTTP 方法（小写）
export const REQUEST_METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "head",
  "connect",
] as const;
