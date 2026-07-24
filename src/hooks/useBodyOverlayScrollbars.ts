// 让 OverlayScrollbars 接管整页（document.body / window）的滚动条。
// 目的：用浮层滚动条替代原生滚动条，避免原生滚动条占用右侧 gutter，
// 导致全宽 sticky header 在右上角与滚动条之间出现缝隙/白边。
// 主题用统一的 os-theme-he（绑定 token，随 [data-theme] 自动明暗切换），无需按主题切换实例。

import { useEffect } from "react";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";
import { HE_SCROLLBAR_THEME } from "@/src/ui/scroll";

export function useBodyOverlayScrollbars(): void {
  useEffect(() => {
    // body 作为目标时，OverlayScrollbars 会接管 window/document 的滚动；
    // cancel.body=false 强制在 body 上初始化（默认 null 会在可能影响浏览器行为时取消）。
    const instance = OverlayScrollbars(
      { target: document.body, cancel: { body: false } },
      {
        scrollbars: {
          theme: HE_SCROLLBAR_THEME,
          autoHide: "scroll",
          autoHideDelay: 500,
        },
      },
    );
    return () => instance.destroy();
  }, []);
}
