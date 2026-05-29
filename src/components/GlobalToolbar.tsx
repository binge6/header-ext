import { useRef } from "react";
import { Switch, Space, Tag, Button, Toast } from "@douyinfe/semi-ui";
import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag";
import { IconDownload, IconUpload } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import {
  buildExport,
  downloadJson,
  parseImport,
  readFileAsText,
} from "@/src/core/portable";

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
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const { togglePause, replaceState } = useProfileActions();

  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const payload = buildExport(profiles, meta);
    downloadJson(t("options.exportFileName"), payload);
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许重复选同一文件
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const { profiles: nextProfiles, meta: nextMeta } = parseImport(text);
      replaceState({ profiles: nextProfiles, meta: nextMeta });
      Toast.success(t("options.importSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "unknown";
      Toast.error(t("options.importFailed", { msg }));
    }
  };

  return (
    <Space align="center">
      <Button size="small" icon={<IconUpload />} onClick={handleImportClick}>
        {t("options.import")}
      </Button>
      <Button size="small" icon={<IconDownload />} onClick={handleExport}>
        {t("options.export")}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
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
