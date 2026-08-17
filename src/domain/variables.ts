import type { ProfileVariable } from "./models";

export function getOverriddenVariableIds(
  variables: ProfileVariable[] | undefined,
): Set<string> {
  const activeNames = new Set<string>();
  const overriddenIds = new Set<string>();

  for (let index = (variables?.length ?? 0) - 1; index >= 0; index--) {
    const variable = variables?.[index];
    if (!variable?.enabled) continue;
    const name = variable.name.trim();
    if (!name) continue;

    if (activeNames.has(name)) overriddenIds.add(variable.id);
    else activeNames.add(name);
  }

  return overriddenIds;
}
