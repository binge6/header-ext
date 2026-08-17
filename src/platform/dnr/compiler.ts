import type { HeaderRule } from "@/src/domain/models";
import type { DnrRule } from "@/src/platform/browser/api";
import { clearIdMap, getDnrId } from "./compiler/idRegistry";
import {
  applyProfileConditions,
  compileProfileConditions,
} from "./compiler/profileConditions";
import { compileRule, expandWithTabFilters } from "./compiler/ruleCompiler";
import type {
  CompiledRuleEntry,
  CompileContext,
  CompileError,
  CompileResult,
} from "./compiler/types";
import { buildVariableMap } from "./compiler/variables";

export { clearIdMap, getDnrId };
export type { CompiledRuleEntry, CompileContext, CompileError, CompileResult };

export function compileRules(
  rules: HeaderRule[],
  context: CompileContext = {},
): CompileResult {
  const compiledRules: DnrRule[] = [];
  const entries: CompiledRuleEntry[] = [];
  const errors: CompileError[] = [];
  const variables = buildVariableMap(context.profile?.variables);
  const profileConditions = compileProfileConditions(
    context.profile,
    variables,
    errors,
  );
  if (profileConditions.hasFatalError) {
    return { rules: [], entries: [], errors };
  }

  for (const sourceRule of rules) {
    if (!sourceRule.enabled) continue;

    const { rule, error } = compileRule(sourceRule, context, variables);
    if (error) errors.push({ ruleId: sourceRule.id, ...error });
    if (!rule) continue;

    const scopedRule = applyProfileConditions(
      rule,
      sourceRule.id,
      profileConditions,
      errors,
    );
    if (!scopedRule) {
      entries.push({ sourceRuleId: sourceRule.id, rules: [] });
      continue;
    }

    const rules = profileConditions.tabFilters.length
      ? expandWithTabFilters(scopedRule, profileConditions.tabFilters)
      : [scopedRule];
    compiledRules.push(...rules);
    entries.push({ sourceRuleId: sourceRule.id, rules });
  }

  return { rules: compiledRules, entries, errors };
}
