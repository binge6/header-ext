import type { ComponentProps } from "react";
import {
  useProfileActions,
  useProfileStore,
} from "@/src/application/profile-store";
import type { DnrRuleError } from "@/src/platform/dnr";
import { useTranslation } from "react-i18next";
import { HeaderRuleList } from "./HeaderRuleList";
import { formatDnrError, shouldDisplayDnrError } from "./format-dnr-error";

const EMPTY_DNR_ERRORS: DnrRuleError[] = [];

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
  const { t } = useTranslation();
  const { addRule, updateRule, deleteRule, toggleRule, reorderRules } =
    useProfileActions();
  const storedDnrErrors = useProfileStore(
    (state) => state.dnrErrors[profileId],
  );
  const dnrErrors = storedDnrErrors ?? EMPTY_DNR_ERRORS;
  const rulesById = new Map(props.rules.map((rule) => [rule.id, rule]));
  const errorMessages = Object.fromEntries(
    dnrErrors
      .filter(
        (error) =>
          !error.sourceRuleId.startsWith("__") &&
          shouldDisplayDnrError(error, rulesById.get(error.sourceRuleId)),
      )
      .map((error) => [error.sourceRuleId, formatDnrError(error, t)]),
  );

  return (
    <HeaderRuleList
      {...props}
      kind={kind}
      target={target}
      errorMessages={errorMessages}
      onAdd={() => addRule(profileId, kind, target)}
      onUpdate={(rule) => updateRule(profileId, rule)}
      onDelete={(ruleId) => deleteRule(profileId, ruleId)}
      onToggle={(ruleId) => toggleRule(profileId, ruleId)}
      onReorder={(ruleIds) => reorderRules(profileId, ruleIds)}
    />
  );
}
