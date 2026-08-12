// RuleRegistry：把当前 active profile 与始终启用 profile 编译并注册到 DNR
// 含 tabIds 的规则只能注册到 session rules（Chrome MV3 限制），
// 其他规则继续注册到 dynamic rules

import type { AppState } from "@/src/domain/models";
import { getEnabledProfileIds } from "@/src/domain/profile-status";
import { dnr, type DnrRule } from "@/src/platform/browser/api";
import { compileRules, clearIdMap } from "./compiler";

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

// applyState 串行化队列：保证多次调用不交错执行 DNR 更新
let applyQueue: Promise<void> = Promise.resolve();

export async function applyState(state: AppState): Promise<void> {
  // 串行化：background 的 init / onInstalled / storage.onChanged 可能并发触发
  // applyState，而每次调用是 read-existing → remove → add 的非原子序列。
  // 若交错执行，后一次会基于陈旧快照计算 removeRuleIds，且 addRules 都从 id=1
  // 重新编号，导致 "Rule with ID already exists" 整批被拒或下发过期规则。
  // 用 Promise 链把每次调用排队，保证前一次完全结束后再开始下一次。
  const run = applyQueue.then(() => doApply(state));
  // 吞掉本次错误以免阻断队列；调用方（background）自行 catch 记录日志
  applyQueue = run.catch(() => {});
  return run;
}

async function doApply(state: AppState): Promise<void> {
  const enabledProfileIds = getEnabledProfileIds(state.meta, state.profiles);

  // 暂停或无开启 profile：仅清空两类规则
  if (state.meta.globalPaused || !enabledProfileIds.length) {
    await clearAll();
    clearIdMap();
    return;
  }

  // 重新生成 DNR id，避免与已有 id 冲突
  clearIdMap();
  const rules: DnrRule[] = [];
  const errors: Array<{ ruleId: string; message: string }> = [];

  for (const profileId of enabledProfileIds) {
    const profile = state.profiles.find((p) => p.id === profileId);
    if (!profile) continue;
    const compiled = compileRules(profile.rules, {
      lockedTabId: state.meta.lockedTabId,
      profile,
    });
    rules.push(...compiled.rules);
    errors.push(
      ...compiled.errors.map((error) => ({
        ...error,
        ruleId: `${profile.name}/${error.ruleId}`,
      })),
    );
  }

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
