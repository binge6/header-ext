import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  manifestVersion: 3,
  vite: () => ({
    plugins: [tailwindcss()],
    build: {
      modulePreload: false,
    },
  }),
  manifest: ({ browser }) => {
    const isFirefox = browser === "firefox";
    return {
      name: "__MSG_extName__",
      description: "__MSG_extDesc__",
      default_locale: "en",
      permissions: ["declarativeNetRequest", "storage", "tabs"],
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
