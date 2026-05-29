// RuleRegistry：把当前激活 profile 的规则编译并注册到 DNR
// 含 tabIds 的规则只能注册到 session rules（Chrome MV3 限制），
// 其他规则继续注册到 dynamic rules

import { dnr } from "./browserApi";
import { compileRules, clearIdMap } from "./compiler";
import type { DnrRule } from "./browserApi";
import type { AppState } from "./types";

function partitionByTabIds(rules: DnrRule[]): {
  session: DnrRule[];
  dynamic: DnrRule[];
} {
  const session: DnrRule[] = [];
  const dynamic: DnrRule[] = [];
  for (const r of rules) {
    if (r.condition.tabIds?.length || r.condition.excludedTabIds?.length) {
      session.push(r);
    } else {
      dynamic.push(r);
    }
  }
  return { session, dynamic };
}

// 给一组规则按位置重新分配从 1 开始的连续 ID，
// 避免 partition 后组内 / 跨组 ID 冲突
function reassignIds(rules: DnrRule[]): DnrRule[] {
  return rules.map((r, idx) => ({ ...r, id: idx + 1 }));
}

async function clearAll(): Promise<void> {
  const [existingDynamic, existingSession] = await Promise.all([
    dnr.getDynamicRules(),
    dnr.getSessionRules(),
  ]);
  if (existingDynamic.length) {
    await dnr.updateDynamicRules({
      removeRuleIds: existingDynamic.map((r) => r.id),
    });
  }
  if (existingSession.length) {
    await dnr.updateSessionRules({
      removeRuleIds: existingSession.map((r) => r.id),
    });
  }
}

export async function applyState(state: AppState): Promise<void> {
  // 暂停或无激活 profile：仅清空两类规则
  if (state.meta.globalPaused || !state.meta.activeProfileId) {
    await clearAll();
    clearIdMap();
    return;
  }

  const profile = state.profiles.find(
    (p) => p.id === state.meta.activeProfileId
  );
  if (!profile) {
    await clearAll();
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

  const [existingDynamic, existingSession] = await Promise.all([
    dnr.getDynamicRules(),
    dnr.getSessionRules(),
  ]);
  const { dynamic, session } = partitionByTabIds(rules);

  await dnr.updateDynamicRules({
    removeRuleIds: existingDynamic.map((r) => r.id),
    addRules: reassignIds(dynamic),
  });
  await dnr.updateSessionRules({
    removeRuleIds: existingSession.map((r) => r.id),
    addRules: reassignIds(session),
  });
}
