import { useMemo, useRef, useState } from "react";
import { Button, Toast, Popover, Checkbox, Tooltip } from "@douyinfe/semi-ui";
import { IconDownload, IconUpload } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import {
  buildExport,
  downloadJson,
  parseImport,
  readFileAsText,
} from "@/src/core/portable";

interface Props {
  /** iconOnly: 仅显示图标按钮（无文字），用于紧凑场景如 popup */
  iconOnly?: boolean;
}

/**
 * 导入 / 导出按钮组合：
 * - 导入：默认合并模式（不覆盖已有 profile）
 * - 导出：Popover 多选选择要导出的 Profile
 * 在 options 顶栏与 popup footer 共用
 */
export function ImportExportButtons({ iconOnly }: Props) {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const { mergeProfiles } = useProfileActions();

  const fileRef = useRef<HTMLInputElement>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportHover, setExportHover] = useState(false);
  // null = 默认全选；数组 = 用户显式选择
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);

  const allIds = useMemo(() => profiles.map((p) => p.id), [profiles]);
  const effectiveSelected = selectedIds ?? allIds;

  const handleExport = () => {
    if (effectiveSelected.length === 0) return;
    const payload = buildExport(profiles, meta, effectiveSelected);
    downloadJson(t("options.exportFileName"), payload);
    setExportOpen(false);
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedIds(checked ? null : []);
  };

  const handleToggleOne = (id: string, checked: boolean) => {
    const current = new Set(effectiveSelected);
    if (checked) current.add(id);
    else current.delete(id);
    setSelectedIds(Array.from(current));
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许重复选同一文件
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const { profiles: incoming } = parseImport(text);
      mergeProfiles(incoming);
      Toast.success(t("options.importSuccess", { count: incoming.length }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "unknown";
      Toast.error(t("options.importFailed", { msg }));
    }
  };

  const exportPanel = (
    <div
      style={{
        width: 240,
        maxHeight: 320,
        display: "flex",
        flexDirection: "column",
        padding: "8px 4px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--he-text-tertiary)",
          padding: "0 8px 6px",
        }}
      >
        {t("options.exportSelectHint")}
      </div>
      <div style={{ padding: "0 8px 6px" }}>
        <Checkbox
          indeterminate={
            effectiveSelected.length > 0 &&
            effectiveSelected.length < allIds.length
          }
          checked={effectiveSelected.length === allIds.length}
          onChange={(e) => handleToggleAll(Boolean(e.target.checked))}
        >
          {t("options.exportSelectAll")}
        </Checkbox>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "0 8px",
        }}
      >
        {profiles.map((p) => (
          <Checkbox
            key={p.id}
            checked={effectiveSelected.includes(p.id)}
            onChange={(e) => handleToggleOne(p.id, Boolean(e.target.checked))}
          >
            {p.name}
          </Checkbox>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          padding: "8px 8px 0",
        }}
      >
        <Button size="small" onClick={() => setExportOpen(false)}>
          {t("common.cancel")}
        </Button>
        <Button
          size="small"
          theme="solid"
          type="primary"
          disabled={effectiveSelected.length === 0}
          onClick={handleExport}
        >
          {t("options.export")}
        </Button>
      </div>
    </div>
  );

  const importBtn = iconOnly ? (
    <Tooltip content={t("options.import")} position="top">
      <Button
        theme="borderless"
        type="tertiary"
        size="small"
        icon={<IconUpload />}
        onClick={handleImportClick}
      />
    </Tooltip>
  ) : (
    <Button size="small" icon={<IconUpload />} onClick={handleImportClick}>
      {t("options.import")}
    </Button>
  );

  const exportTrigger = iconOnly ? (
    <span style={{ display: "inline-flex" }}>
      <Tooltip
        trigger="custom"
        visible={exportHover && !exportOpen}
        content={t("options.export")}
        position="top"
      >
        <Button
          theme="borderless"
          type="tertiary"
          size="small"
          icon={<IconDownload />}
          disabled={profiles.length === 0}
          onMouseEnter={() => setExportHover(true)}
          onMouseLeave={() => setExportHover(false)}
          onClick={() => {
            setExportHover(false);
            setExportOpen((v) => !v);
          }}
        />
      </Tooltip>
    </span>
  ) : (
    <Button
      size="small"
      icon={<IconDownload />}
      disabled={profiles.length === 0}
      onClick={() => setExportOpen((v) => !v)}
    >
      {t("options.export")}
    </Button>
  );

  return (
    <>
      {importBtn}
      <Popover
        trigger="custom"
        visible={exportOpen}
        onClickOutSide={() => setExportOpen(false)}
        position={iconOnly ? "topRight" : "bottomRight"}
        content={exportPanel}
      >
        {exportTrigger}
      </Popover>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
