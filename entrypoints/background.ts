import {
  applyState,
  onDnrReinitializeRequest,
  reinitializeRules,
} from "@/src/platform/dnr";
import { onExtensionInstalled, setActionBadge } from "@/src/platform/browser";
import { loadState, subscribeState } from "@/src/platform/storage";
import { getBadgeSummary } from "@/src/domain";
import type { AppState } from "@/src/domain";

// 角标状态色：暂停(warning) / 生效(primary)
const BADGE_PAUSED_COLOR = "#f59e0b";
const BADGE_ACTIVE_COLOR = "#2563eb";

async function syncBadge(state: AppState): Promise<void> {
  const summary = getBadgeSummary(state);
  await setActionBadge({
    text: summary.text,
    backgroundColor: summary.paused ? BADGE_PAUSED_COLOR : BADGE_ACTIVE_COLOR,
  });
}

export default defineBackground(() => {
  // SW 启动 / 唤醒：从 storage 重建状态并应用到 DNR
  const init = async () => {
    try {
      const state = await loadState();
      await applyState(state);
      await syncBadge(state);
    } catch (err) {
      console.error("[header-ext] init failed", err);
    }
  };

  void init();

  // 订阅 storage 变化，UI 修改后立即更新 DNR
  subscribeState((next) => {
    void applyState(next).catch((err) => {
      console.error("[header-ext] applyState failed", err);
    });
    void syncBadge(next).catch((err) => {
      console.error("[header-ext] syncBadge failed", err);
    });
  });

  onDnrReinitializeRequest(async () => {
    const state = await loadState();
    await reinitializeRules(state);
    await syncBadge(state);
  });

  // 安装时确保初始化
  onExtensionInstalled(() => {
    void init();
  });
});
