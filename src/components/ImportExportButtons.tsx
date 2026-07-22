import { useMemo, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import {
  buildExport,
  downloadJson,
  parseImport,
  readFileAsText,
} from "@/src/core/portable";
import {
  Button,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "./ui";

interface Props {
  /** iconOnly: 仅显示图标按钮（无文字），用于紧凑场景如 popup */
  iconOnly?: boolean;
  /** menuItem: 渲染为下拉菜单项，用于更多菜单内 */
  menuItem?: boolean;
  onImportRequest?: () => void;
}

/**
 * 导入 / 导出按钮组合：
 * - 导入：默认合并模式（不覆盖已有 profile）
 * - 导出：Popover 多选选择要导出的 Profile
 * 在 options 顶栏与 popup footer 共用
 */
export function ImportExportButtons({
  iconOnly,
  menuItem,
  onImportRequest,
}: Props) {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const { mergeProfiles } = useProfileActions();

  const fileRef = useRef<HTMLInputElement>(null);

  const [exportOpen, setExportOpen] = useState(false);
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

  const handleImportClick = () => {
    if (onImportRequest) {
      onImportRequest();
      return;
    }
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许重复选同一文件
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const { profiles: incoming, meta: incomingMeta } = parseImport(text);
      mergeProfiles(incoming, incomingMeta);
      toast.success(t("options.importSuccess", { count: incoming.length }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "unknown";
      toast.error(t("options.importFailed", { msg }));
    }
  };

  const exportPanel = (
    <div className="flex max-h-80 w-60 flex-col">
      <div className="px-1 pb-2 text-xs font-medium text-muted-foreground">
        {t("options.exportSelectHint")}
      </div>
      <div className="border-b border-border px-1 pb-2">
        <Checkbox
          checked={
            effectiveSelected.length > 0 &&
            effectiveSelected.length < allIds.length
              ? "indeterminate"
              : effectiveSelected.length === allIds.length
          }
          label={t("options.exportSelectAll")}
          onCheckedChange={handleToggleAll}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 py-2">
        {profiles.map((p) => (
          <Checkbox
            key={p.id}
            checked={effectiveSelected.includes(p.id)}
            label={p.name}
            onCheckedChange={(checked) => handleToggleOne(p.id, checked)}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-1 pt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setExportOpen(false)}
        >
          {t("common.cancel")}
        </Button>
        <Button
          size="sm"
          disabled={effectiveSelected.length === 0}
          onClick={handleExport}
        >
          {t("options.export")}
        </Button>
      </div>
    </div>
  );

  const importBtn = menuItem ? (
    <button
      type="button"
      className="he-menu-item"
      onClick={(event) => {
        event.preventDefault();
        handleImportClick();
      }}
    >
      <Upload aria-hidden="true" />
      {t("options.import")}
    </button>
  ) : iconOnly ? (
    <Tooltip content={t("options.import")}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("options.import")}
        onClick={handleImportClick}
      >
        <Upload aria-hidden="true" />
      </Button>
    </Tooltip>
  ) : (
    <Button size="sm" variant="outline" onClick={handleImportClick}>
      <Upload aria-hidden="true" />
      {t("options.import")}
    </Button>
  );

  const exportTrigger = menuItem ? (
    <PopoverTrigger asChild>
      <button
        type="button"
        className="he-menu-item"
        disabled={profiles.length === 0}
      >
        <Download aria-hidden="true" />
        {t("options.export")}
      </button>
    </PopoverTrigger>
  ) : iconOnly ? (
    <Tooltip content={t("options.export")} disabled={exportOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("options.export")}
          disabled={profiles.length === 0}
        >
          <Download aria-hidden="true" />
        </Button>
      </PopoverTrigger>
    </Tooltip>
  ) : (
    <PopoverTrigger asChild>
      <Button
        size="sm"
        variant="outline"
        disabled={profiles.length === 0}
      >
        <Download aria-hidden="true" />
        {t("options.export")}
      </Button>
    </PopoverTrigger>
  );

  return (
    <div className={menuItem ? "block" : "inline-flex items-center gap-1"}>
      {importBtn}
      <Popover open={exportOpen} onOpenChange={setExportOpen}>
        {exportTrigger}
        <PopoverContent
          side={iconOnly ? "top" : "bottom"}
          align="end"
          className="p-3"
        >
          {exportPanel}
        </PopoverContent>
      </Popover>
      {!onImportRequest && (
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
