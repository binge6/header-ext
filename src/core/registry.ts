// RuleRegistry：把当前激活 profile 的规则编译并注册到 DNR
// 每次 apply 都做全量替换（P0 简化，后续可改增量 diff）

import { dnr } from "./browserApi";
import { compileRules, clearIdMap } from "./compiler";
import type { AppState } from "./types";

export async function applyState(state: AppState): Promise<void> {
  // 取出当前所有动态规则的 id，用于全量清空
  const existing = await dnr.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  // 暂停或无激活 profile：仅清空
  if (state.meta.globalPaused || !state.meta.activeProfileId) {
    if (removeRuleIds.length) {
      await dnr.updateDynamicRules({ removeRuleIds });
    }
    clearIdMap();
    return;
  }

  const profile = state.profiles.find(
    (p) => p.id === state.meta.activeProfileId
  );
  if (!profile) {
    if (removeRuleIds.length) {
      await dnr.updateDynamicRules({ removeRuleIds });
    }
    clearIdMap();
    return;
  }

  // 重新生成 DNR id，避免与已有 id 冲突
  clearIdMap();
  const { rules, errors } = compileRules(profile.rules, {
    lockedTabId: state.meta.lockedTabId,
    profile,
  });

  if (errors.length) {
    console.warn("[header-ext] compile errors:", errors);
  }

  await dnr.updateDynamicRules({
    removeRuleIds,
    addRules: rules,
  });
}
