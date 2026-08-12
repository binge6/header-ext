import type { ComponentProps } from "react";
import { HeaderRuleList } from "./HeaderRuleList";
import { useProfileActions } from "@/src/store/profileStore";

type ProfileHeaderRuleListProps = Omit<
  ComponentProps<typeof HeaderRuleList>,
  "onAdd" | "onUpdate" | "onDelete" | "onToggle" | "onReorder"
> & {
  profileId: string;
};

export function ProfileHeaderRuleList({
  profileId,
  kind,
  target,
  ...props
}: ProfileHeaderRuleListProps) {
  const { addRule, updateRule, deleteRule, toggleRule, reorderRules } =
    useProfileActions();

  return (
    <HeaderRuleList
      {...props}
      kind={kind}
      target={target}
      onAdd={() => addRule(profileId, kind, target)}
      onUpdate={(rule) => updateRule(profileId, rule)}
      onDelete={(ruleId) => deleteRule(profileId, ruleId)}
      onToggle={(ruleId) => toggleRule(profileId, ruleId)}
      onReorder={(ruleIds) => reorderRules(profileId, ruleIds)}
    />
  );
}
