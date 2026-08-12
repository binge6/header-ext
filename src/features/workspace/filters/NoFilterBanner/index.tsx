import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/application/profile-store";
import { getProfileStats } from "@/src/domain";
import { cn } from "@/src/shared/lib/cn";
import styles from "./index.module.scss";

interface Props {
  /** compact: 紧凑单行模式（用于 popup 底部空间受限场景） */
  compact?: boolean;
}

/**
 * 当激活 Profile 存在启用规则、却没有任何作用范围（既无 profile 级过滤项，
 * 也存在自身无行级条件的规则）时，提示用户当前修改将作用于所有请求。
 * 纯 Redirect/URL 重写或每行自带行级过滤的 profile 不会触发。
 */
export function NoFilterBanner({ compact }: Props) {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const profile = profiles.find((p) => p.id === activeId);
  if (!profile) return null;

  // 与 badge / popup 风险提示共用同一判定，避免作用范围逻辑重复实现而漂移
  if (!getProfileStats(profile).hasGlobalRisk) return null;

  const fullText = t("filters.noFilterHint");

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-warning-soft px-2.5 py-1.5 text-warning",
          styles.warningCompact,
        )}
        title={fullText}
      >
        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-xs text-foreground">
          {fullText}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl bg-info-soft px-4 py-3",
        styles.infoBanner,
      )}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-info">
        <AlertTriangle aria-hidden="true" className="h-4 w-4" />
      </div>
      <div>
        <div className="text-group-title font-semibold text-foreground">
          {t("filters.noFilterTitle")}
        </div>
        <div className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {fullText}
        </div>
      </div>
    </div>
  );
}
