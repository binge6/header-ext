import { useRef } from "react";
import { Switch, Space, Tag, Button, message } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";
import {
  buildExport,
  downloadJson,
  parseImport,
  readFileAsText,
} from "@/src/core/portable";

export function GlobalToolbar() {
  const { t } = useTranslation();
  const paused = useProfileStore((s) => s.meta.globalPaused);
  const togglePause = useProfileStore((s) => s.togglePause);
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const replaceState = useProfileStore((s) => s.replaceState);

  const fileRef = useRef<HTMLInputElement>(null);
  const [api, ctx] = message.useMessage();

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
      api.success(t("options.importSuccess"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "unknown";
      api.error(t("options.importFailed", { msg }));
    }
  };

  return (
    <Space align="center">
      {ctx}
      <Button
        size="small"
        icon={<UploadOutlined />}
        onClick={handleImportClick}
      >
        {t("options.import")}
      </Button>
      <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>
        {t("options.export")}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {paused && <Tag color="warning">{t("popup.globalPaused")}</Tag>}
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
