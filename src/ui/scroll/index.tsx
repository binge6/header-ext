import { forwardRef, type ComponentPropsWithoutRef } from "react";
import "overlayscrollbars/overlayscrollbars.css";
import "./index.scss";
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";
import type { EventListeners, PartialOptions } from "overlayscrollbars";
import { cn } from "@/src/utils/cn";

// 全项目统一的浮层滚动条主题（handle 颜色/尺寸绑定设计 token，随 [data-theme] 自动明暗切换）。
export const HE_SCROLLBAR_THEME = "os-theme-he";

const defaultOptions: PartialOptions = {
  scrollbars: {
    theme: HE_SCROLLBAR_THEME,
    autoHide: "leave",
    autoHideDelay: 500,
  },
};

type ScrollerProps = ComponentPropsWithoutRef<"div"> & {
  /** 额外覆盖/合并 OverlayScrollbars 选项。 */
  options?: PartialOptions;
  /** OverlayScrollbars 事件监听（如 scroll / updated）。 */
  events?: EventListeners;
  /** 是否延迟到浏览器空闲时初始化（长列表可开）。 */
  defer?: boolean;
};

/**
 * 通用滚动容器：用 OverlayScrollbars 浮层滚动条替代原生滚动条。
 * 直接替换原本挂 `overflow-y-auto` 的 div 即可；高度约束（max-height/flex）照常写在 className 上。
 */
export const Scroller = forwardRef<
  OverlayScrollbarsComponentRef,
  ScrollerProps
>(({ options, events, defer = true, className, children, ...props }, ref) => (
  <OverlayScrollbarsComponent
    ref={ref}
    defer={defer}
    events={events}
    options={
      options
        ? {
            ...defaultOptions,
            ...options,
            scrollbars: {
              ...defaultOptions.scrollbars,
              ...(options.scrollbars ?? {}),
            },
          }
        : defaultOptions
    }
    className={cn("he-scroller", className)}
    {...props}
  >
    {children}
  </OverlayScrollbarsComponent>
));
Scroller.displayName = "Scroller";
