import type { HeaderRule, RuleKind } from "@/src/domain";

export interface HeaderRuleListProps {
  // 用 kind 决定标题和行字段：
  //   header => 普通 [action][name][value]
  //   cookie-request-append / cookie-response-append => [name][value]
  kind: RuleKind;
  // kind === "header" 时显式指定分组方向，避免 rules 为空时 fallback 错误
  target?: "request" | "response";
  rules: HeaderRule[];
  onAdd: () => void;
  onUpdate: (rule: HeaderRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
  onReorder?: (orderedRuleIds: string[]) => void;
  variant?: "compact" | "editor";
  advancedPopoverDensity?: "default" | "compact";
  actionControlVariant?: "select" | "compact-menu";
}

export type HeaderRuleMode = Pick<
  HeaderRuleListProps,
  "advancedPopoverDensity" | "actionControlVariant"
> & {
  isCookie: boolean;
  isRedirect: boolean;
  isEditor: boolean;
};
