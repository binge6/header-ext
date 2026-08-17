import type { ProfileVariable } from "@/src/domain/models";
import { getOverriddenVariableIds } from "@/src/domain/variables";

const VARIABLE_TOKEN_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

export interface VariableResolution {
  value: string;
  missing: string[];
}

export function buildVariableMap(
  variables: ProfileVariable[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  const overriddenIds = getOverriddenVariableIds(variables);
  for (const variable of variables ?? []) {
    const name = variable.name.trim();
    if (variable.enabled && name && !overriddenIds.has(variable.id)) {
      map.set(name, variable.value);
    }
  }
  return map;
}

export function resolveVariables(
  value: string | undefined,
  variables: Map<string, string>,
): VariableResolution {
  if (!value) return { value: value ?? "", missing: [] };

  const missing = new Set<string>();
  const resolvedValue = value.replace(
    VARIABLE_TOKEN_RE,
    (match, rawName: string) => {
      const name = rawName.trim();
      if (!variables.has(name)) {
        missing.add(name);
        return match;
      }
      return variables.get(name) ?? "";
    },
  );

  return { value: resolvedValue, missing: Array.from(missing) };
}

export function resolveVariableList(
  values: string[] | undefined,
  variables: Map<string, string>,
): { values?: string[]; missing: string[] } {
  if (!values?.length) return { missing: [] };

  const missing = new Set<string>();
  const resolvedValues = values.map((value) => {
    const resolved = resolveVariables(value, variables);
    resolved.missing.forEach((name) => missing.add(name));
    return resolved.value;
  });

  return { values: resolvedValues, missing: Array.from(missing) };
}
