// 运行时能力探测：UI 据此隐藏不支持的能力（Chrome / Firefox 差异）

export interface Capabilities {
  hasDeclarativeNetRequest: boolean;
  hasWebRequestBlocking: boolean;
  isFirefox: boolean;
}

// 兼容 chrome.* 入口（极少数 SW 启动早期 wxt 尚未注入 polyfill）
type MaybeBrowser = Partial<typeof browser> | undefined;
function getBrowserLike(): MaybeBrowser {
  if (typeof browser !== "undefined") return browser;
  const g = globalThis as unknown as { chrome?: MaybeBrowser };
  return g.chrome;
}

export function detectCapabilities(): Capabilities {
  const b = getBrowserLike();

  const ua = typeof navigator !== "undefined" ? navigator.userAgent ?? "" : "";
  const isFirefox = /firefox/i.test(ua);

  return {
    hasDeclarativeNetRequest: Boolean(
      b?.declarativeNetRequest?.updateDynamicRules
    ),
    // 仅 Firefox MV3 仍提供 webRequestBlocking
    hasWebRequestBlocking: Boolean(
      isFirefox && b?.webRequest?.onBeforeSendHeaders
    ),
    isFirefox,
  };
}
