import { Banner, Typography } from "@douyinfe/semi-ui";
import { IconAlertTriangle } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";

const { Text } = Typography;

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
    // 紧凑提示：使用 Semi Text ellipsis 单行省略 + 自动 Tooltip
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          background: "var(--semi-color-warning-light-default)",
          borderRadius: 4,
        }}
      >
        <IconAlertTriangle
          size="small"
          style={{ color: "var(--semi-color-warning)", flexShrink: 0 }}
        />
        <Text
          size="small"
          ellipsis={{ showTooltip: { opts: { content: fullText } } }}
          style={{ flex: 1, minWidth: 0 }}
        >
          {fullText}
        </Text>
      </div>
    );
  }

  return (
    <Banner
      type="info"
      fullMode={false}
      closeIcon={null}
      description={fullText}
    />
  );
}
