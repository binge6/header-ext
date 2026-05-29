import { Switch, Space, Tag } from "@douyinfe/semi-ui";
import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { ImportExportButtons } from "@/src/components/ImportExportButtons";

const TAG_COLORS: ReadonlySet<TagColor> = new Set<TagColor>([
  "amber",
  "blue",
  "cyan",
  "green",
  "grey",
  "indigo",
  "light-blue",
  "light-green",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "violet",
  "yellow",
  "white",
]);

function mapTagColor(input?: string): TagColor {
  if (!input) return "grey";
  switch (input) {
    case "warning":
      return "amber";
    case "success":
      return "green";
    case "processing":
      return "blue";
    case "error":
      return "red";
    case "default":
      return "grey";
  }
  return TAG_COLORS.has(input as TagColor) ? (input as TagColor) : "grey";
}

export function GlobalToolbar() {
  const { t } = useTranslation();
  const paused = useProfileStore((s) => s.meta.globalPaused);
  const { togglePause } = useProfileActions();

  return (
    <Space align="center">
      <ImportExportButtons />
      {paused && (
        <Tag color={mapTagColor("warning")} type="solid">
          {t("popup.globalPaused")}
        </Tag>
      )}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          lineHeight: 1,
        }}
      >
        {t("options.globalPaused")}
        <Switch size="small" checked={paused} onChange={() => togglePause()} />
      </span>
    </Space>
  );
}
