// 主题切换：浅色 / 深色 / 跟随系统
// 与 LanguageSwitcher 风格保持一致：icon 模式 hover 出菜单，select 模式下拉

import { Button, Dropdown, Select } from "@douyinfe/semi-ui";
import { IconBulb, IconMoon, IconSun } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useThemeMode, type ThemeMode } from "@/src/hooks/useThemeMode";

interface Props {
  variant?: "icon" | "select";
  size?: "small" | "default";
}

const MODES: ThemeMode[] = ["light", "dark", "system"];

export function ThemeSwitcher({
  variant = "select",
  size = "small",
}: Props = {}) {
  const { t } = useTranslation();
  const { mode, isDark, setMode } = useThemeMode();

  const renderIcon = () => {
    if (mode === "system") return <IconBulb />;
    return isDark ? <IconMoon /> : <IconSun />;
  };

  if (variant === "icon") {
    return (
      <Dropdown
        trigger="hover"
        position="bottomRight"
        render={
          <Dropdown.Menu>
            {MODES.map((m) => (
              <Dropdown.Item key={m} onClick={() => setMode(m)}>
                {t(`theme.${m}`)}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        }
      >
        <Button
          theme="borderless"
          type="tertiary"
          size={size}
          icon={renderIcon()}
        />
      </Dropdown>
    );
  }

  return (
    <Select
      size={size}
      value={mode}
      style={{ width: 130 }}
      onChange={(v) => setMode(v as ThemeMode)}
      optionList={MODES.map((m) => ({ value: m, label: t(`theme.${m}`) }))}
    />
  );
}
