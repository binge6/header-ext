import type { ComponentProps } from "react";
import { useProfileActions } from "@/src/application/profile-store";
import { Button } from "@/src/shared/ui";
import { VariableList } from "./VariableList";

type ProfileVariableListProps = Omit<
  ComponentProps<typeof VariableList>,
  "onAdd" | "onUpdate" | "onDelete" | "onToggle"
> & {
  profileId: string;
};

export function ProfileVariableList({
  profileId,
  ...props
}: ProfileVariableListProps) {
  const { addVariable, updateVariable, deleteVariable, toggleVariable } =
    useProfileActions();

  return (
    <VariableList
      {...props}
      onAdd={() => addVariable(profileId)}
      onUpdate={(variable) => updateVariable(profileId, variable)}
      onDelete={(variableId) => deleteVariable(profileId, variableId)}
      onToggle={(variableId) => toggleVariable(profileId, variableId)}
    />
  );
}

type ProfileAddVariableButtonProps = Omit<
  ComponentProps<typeof Button>,
  "onClick"
> & {
  profileId: string;
};

export function ProfileAddVariableButton({
  profileId,
  ...props
}: ProfileAddVariableButtonProps) {
  const { addVariable } = useProfileActions();

  return <Button {...props} onClick={() => addVariable(profileId)} />;
}
