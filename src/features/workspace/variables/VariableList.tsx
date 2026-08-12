import { Braces, Info, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProfileVariable } from "@/src/domain";
import { cn } from "@/src/shared/lib/cn";
import { Button, Checkbox, Input, Tooltip } from "@/src/shared/ui";
import { GroupHeader } from "../components/GroupHeader";
import {
  editorFieldClassName,
  editorRuleRowClassName,
  editorSectionClassName,
  editorSectionCountClassName,
  editorSectionHeaderClassName,
  editorSectionIconClassName,
  editorSectionIconVariants,
  editorSectionTitleClassName,
  mutedTextClassName,
} from "../components/editor-styles";

interface Props {
  variables: ProfileVariable[];
  onAdd: () => void;
  onUpdate: (variable: ProfileVariable) => void;
  onDelete: (variableId: string) => void;
  onToggle: (variableId: string) => void;
  variant?: "compact" | "editor";
  showEmpty?: boolean;
}

export function VariableList({
  variables,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  variant = "compact",
  showEmpty = false,
}: Props) {
  const { t } = useTranslation();
  const isEditor = variant === "editor";
  const groupEnabled = variables.some((variable) => variable.enabled);
  const groupToggleState =
    groupEnabled && variables.some((variable) => !variable.enabled)
      ? "indeterminate"
      : groupEnabled;
  const groupPartiallyEnabled = groupToggleState === "indeterminate";
  const groupToggleLabel =
    groupEnabled && !groupPartiallyEnabled
      ? t("variables.disableGroup")
      : t("variables.enableGroup");

  const handleToggleGroup = (enabled: boolean) => {
    variables.forEach((variable) => {
      if (variable.enabled !== enabled) onToggle(variable.id);
    });
  };

  const renderToggle = (
    checked: boolean,
    ariaLabel: string,
    onCheckedChange: (checked: boolean) => void,
    disabled = false,
  ) => (
    <Tooltip content={ariaLabel} keepOpenOnClick>
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onCheckedChange={onCheckedChange}
      />
    </Tooltip>
  );

  const renderGroupToggle = () => (
    <Tooltip content={groupToggleLabel} keepOpenOnClick>
      <Checkbox
        checked={groupToggleState}
        disabled={variables.length === 0}
        aria-label={groupToggleLabel}
        onCheckedChange={handleToggleGroup}
      />
    </Tooltip>
  );

  const rows =
    variables.length === 0 ? (
      <div className={cn(mutedTextClassName, isEditor ? "px-3 py-2" : "py-1")}>
        {t("variables.empty", { syntax: "{{name}}" })}
      </div>
    ) : (
      variables.map((variable) => (
        <div
          key={variable.id}
          className={cn(
            isEditor ? editorRuleRowClassName : "flex items-center gap-1 py-1",
            isEditor && !variable.enabled && "opacity-70",
          )}
        >
          <Input
            placeholder={t("variables.namePlaceholder")}
            className={cn("min-w-0 flex-1", isEditor && editorFieldClassName)}
            value={variable.name}
            onChange={(event) =>
              onUpdate({ ...variable, name: event.target.value })
            }
          />
          <Input
            placeholder={t("variables.valuePlaceholder")}
            className={cn("min-w-0 flex-1", isEditor && editorFieldClassName)}
            value={variable.value}
            onChange={(event) =>
              onUpdate({ ...variable, value: event.target.value })
            }
          />
          <Tooltip content={t("variables.deleteItem")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("variables.deleteItem")}
              onClick={() => onDelete(variable.id)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </Tooltip>
          {renderToggle(
            variable.enabled,
            variable.enabled
              ? t("variables.disableItem")
              : t("variables.enableItem"),
            () => onToggle(variable.id),
          )}
        </div>
      ))
    );

  if (isEditor) {
    if (!variables.length && !showEmpty) return null;

    return (
      <section className={editorSectionClassName}>
        <div className={editorSectionHeaderClassName}>
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                editorSectionIconClassName,
                editorSectionIconVariants.variable,
              )}
            >
              <Braces aria-hidden="true" />
            </span>
            <span className={editorSectionTitleClassName}>
              {t("variables.title")}
            </span>
            <Tooltip content={t("variables.hint", { syntax: "{{name}}" })}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5"
                aria-label={t("variables.hint", { syntax: "{{name}}" })}
              >
                <Info aria-hidden="true" />
              </Button>
            </Tooltip>
            <span className={editorSectionCountClassName}>
              {variables.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content={t("variables.addItem")}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("variables.addItem")}
                onClick={onAdd}
              >
                <Plus aria-hidden="true" />
              </Button>
            </Tooltip>
            {renderGroupToggle()}
          </div>
        </div>
        <div className="flex flex-col">{rows}</div>
      </section>
    );
  }

  return (
    <div>
      <GroupHeader
        title={t("variables.title")}
        addLabel={t("variables.addItem")}
        onAdd={onAdd}
      />
      <div className={cn(mutedTextClassName, "mb-1")}>
        {t("variables.hint", { syntax: "{{name}}" })}
      </div>
      {rows}
    </div>
  );
}
