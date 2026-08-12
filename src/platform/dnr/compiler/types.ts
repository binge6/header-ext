import type { Profile } from "@/src/domain/models";

export interface CompileError {
  ruleId: string;
  message: string;
}

export interface CompileResult {
  rules: import("@/src/platform/browser/api").DnrRule[];
  errors: CompileError[];
}

export interface CompileContext {
  // 兼容老调用，保留字段。
  lockedTabId?: number | null;
  // 当前生效 Profile，用于读取 Profile 级过滤器与变量。
  profile?: Profile;
}
