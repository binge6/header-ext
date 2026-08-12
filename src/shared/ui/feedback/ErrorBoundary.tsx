import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "../controls";

// 错误边界的静态双语文案：错误 UI 不依赖 store / useTranslation，
// 因为 i18n 初始化失败本身就是一种崩溃场景（会导致整页无法渲染）。
// 这里同步读取 i18n.language，取不到时兜底英文。
const COPY = {
  "zh-CN": {
    title: "页面出错了",
    description:
      "扩展遇到未预期的错误。可尝试重新加载；若反复出现，请检查或重置数据。",
    reload: "重新加载",
  },
  "en-US": {
    title: "Something went wrong",
    description:
      "The extension hit an unexpected error. Try reloading; if it keeps happening, review or reset your data.",
    reload: "Reload",
  },
} as const;

function resolveCopy(): (typeof COPY)[keyof typeof COPY] {
  return typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("zh")
    ? COPY["zh-CN"]
    : COPY["en-US"];
}

interface Props {
  children: ReactNode;
  /** 可选的重置动作；未提供时「重新加载」按钮回退到 location.reload() */
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * 应用级错误边界：兜住渲染期抛出的异常，避免整页白屏。
 * 包裹两个入口的 <App />，是所有「渲染期崩溃」类问题的最后防线。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[header-ext] render error boundary caught:", error, info);
  }

  private handleReload = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
      this.setState({ error: null });
      return;
    }
    location.reload();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    const copy = resolveCopy();
    return (
      <div className="he-error-boundary" role="alert">
        <span className="he-error-boundary-icon">
          <TriangleAlert aria-hidden="true" />
        </span>
        <div className="he-error-boundary-title">{copy.title}</div>
        <p className="he-error-boundary-desc">{copy.description}</p>
        <pre className="he-error-boundary-detail">
          {this.state.error.message}
        </pre>
        <Button size="sm" onClick={this.handleReload}>
          {copy.reload}
        </Button>
      </div>
    );
  }
}
