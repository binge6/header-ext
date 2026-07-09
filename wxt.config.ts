import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import semiTheming from "@douyinfe/semi-vite-plugin";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  manifestVersion: 3,
  vite: () => ({
    // Semi 官方 Vite 插件：将 Semi 编译产物包进 @layer semi{}，
    // 使 Tailwind Preflight(base 层) 优先级低于 Semi、Semi 又低于用户原子类(utilities)。
    // 层级顺序在 tailwind.css 中通过 `@layer base, semi, utilities;` 声明。
    plugins: [semiTheming({ cssLayer: true }), tailwindcss()],
  }),
  manifest: ({ browser }) => {
    const isFirefox = browser === "firefox";
    return {
      name: "__MSG_extName__",
      description: "__MSG_extDesc__",
      default_locale: "en",
      permissions: [
        "declarativeNetRequest",
        "declarativeNetRequestFeedback",
        "storage",
        "tabs",
      ],
      host_permissions: ["<all_urls>"],
      // 注：popup 的 default_title / options 的 open_in_tab 由各自 entrypoint
      // 的 HTML <meta name="manifest.*"> 声明，写在这里会被 WXT 覆盖。
      // Firefox MV3 必填
      ...(isFirefox
        ? {
            browser_specific_settings: {
              gecko: {
                id: "header-ext@binge430.cn",
                strict_min_version: "128.0",
                // Firefox AMO 自 2025 起强制要求声明数据收集权限。
                // 本扩展不收集任何用户数据，全部规则只存于本地 storage.local。
                data_collection_permissions: {
                  required: ["none"],
                },
              },
            },
          }
        : {}),
    };
  },
});
