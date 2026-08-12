import type { HeaderRule } from "@/src/domain/models";
import type { DnrRule } from "@/src/platform/browser/api";
import { clearIdMap, getDnrId } from "./compiler/idRegistry";
import {
  applyProfileConditions,
  compileProfileConditions,
} from "./compiler/profileConditions";
import { compileRule, expandWithTabFilters } from "./compiler/ruleCompiler";
import type {
  CompileContext,
  CompileError,
  CompileResult,
} from "./compiler/types";
import { buildVariableMap } from "./compiler/variables";

export { clearIdMap, getDnrId };
export type { CompileContext, CompileError, CompileResult };

export function compileRules(
  rules: HeaderRule[],
  context: CompileContext = {},
): CompileResult {
  const compiledRules: DnrRule[] = [];
  const errors: CompileError[] = [];
  const variables = buildVariableMap(context.profile?.variables);
  const profileConditions = compileProfileConditions(
    context.profile,
    variables,
    errors,
  );
  if (profileConditions.hasVariableError) return { rules: [], errors };

  for (const sourceRule of rules) {
    if (!sourceRule.enabled) continue;

    const { rule, error } = compileRule(sourceRule, context, variables);
    if (error) errors.push({ ruleId: sourceRule.id, message: error });
    if (!rule) continue;

    const scopedRule = applyProfileConditions(
      rule,
      sourceRule.id,
      profileConditions,
      errors,
    );
    if (!scopedRule) continue;

    if (profileConditions.tabFilters.length) {
      compiledRules.push(
        ...expandWithTabFilters(scopedRule, profileConditions.tabFilters),
      );
    } else {
      compiledRules.push(scopedRule);
    }
  }

  return { rules: compiledRules, errors };
}
