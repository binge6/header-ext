import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";
import { cn } from "@/src/utils/cn";
import styles from "./index.module.scss";

interface Props {
  /** compact: 紧凑单行模式（用于 popup 底部空间受限场景） */
  compact?: boolean;
}

/**
 * 当激活 Profile 没有任何启用的过滤项（tab / domain / url / excludeUrl / method）时，
 * 提示用户当前修改将作用于所有请求。
 */
export function NoFilterBanner({ compact }: Props) {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const profile = profiles.find((p) => p.id === activeId);
  if (!profile) return null;

  const hasEnabledFilter =
    (profile.tabFilters ?? []).some((f) => f.enabled && f.urlFilter?.trim()) ||
    (profile.domainFilters ?? []).some((f) => f.enabled && f.domain?.trim()) ||
    (profile.urlFilters ?? []).some((f) => f.enabled && f.regex?.trim()) ||
    (profile.excludeUrlFilters ?? []).some((f) => f.enabled && f.url?.trim()) ||
    (profile.methodFilters ?? []).some((f) => f.enabled && f.method?.trim());

  if (hasEnabledFilter) return null;

  // 仅当 profile 至少存在一条启用的规则时才提示，否则没有任何修改在生效
  const hasEnabledRule = (profile.rules ?? []).some((r) => r.enabled);
  if (!hasEnabledRule) return null;

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
