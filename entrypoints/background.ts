import { loadState, subscribeState } from '../src/core/storage';
import { applyState } from '../src/core/registry';

export default defineBackground(() => {
  // SW 启动 / 唤醒：从 storage 重建状态并应用到 DNR
  const init = async () => {
    try {
      const state = await loadState();
      await applyState(state);
    } catch (err) {
      console.error('[header-ext] init failed', err);
    }
  };

  void init();

  // 订阅 storage 变化，UI 修改后立即更新 DNR
  subscribeState((next) => {
    void applyState(next).catch((err) => {
      console.error('[header-ext] applyState failed', err);
    });
  });

  // 安装时确保初始化
  browser.runtime.onInstalled.addListener(() => {
    void init();
  });
});
