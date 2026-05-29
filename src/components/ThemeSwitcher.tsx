// 主题切换：浅色 / 深色 / 跟随系统
// 与 LanguageSwitcher 风格保持一致：icon 模式 hover 出菜单，select 模式下拉

import { Button, Dropdown, Select } from "antd";
import {
  BulbOutlined,
  MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useThemeMode, type ThemeMode } from "@/src/hooks/useThemeMode";

interface Props {
  variant?: "icon" | "select";
  size?: "small" | "middle";
}

const MODES: ThemeMode[] = ["light", "dark", "system"];

export function ThemeSwitcher({
  variant = "select",
  size = "small",
}: Props = {}) {
  const { t } = useTranslation();
  const { mode, isDark, setMode } = useThemeMode();

  const renderIcon = () => {
    if (mode === "system") return <BulbOutlined />;
    return isDark ? <MoonOutlined /> : <SunOutlined />;
  };

  if (variant === "icon") {
    const items = MODES.map((m) => ({
      key: m,
      label: t(`theme.${m}`),
      onClick: () => setMode(m),
    }));
    return (
      <Dropdown
        menu={{ items, selectedKeys: [mode] }}
        trigger={["hover", "click"]}
        placement="bottomRight"
      >
        <Button type="text" size={size} icon={renderIcon()} />
      </Dropdown>
    );
  }

  return (
    <Select
      size={size}
      value={mode}
      style={{ width: 130 }}
      onChange={(v) => setMode(v as ThemeMode)}
      options={MODES.map((m) => ({ value: m, label: t(`theme.${m}`) }))}
    />
  );
}
