import { Button, Dropdown, Select } from "@douyinfe/semi-ui";
import { IconLanguage } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { setLanguage, SUPPORTED_LANGS, type Lang } from "@/src/i18n";

interface Props {
  /** icon: 仅图标按钮（适合空间紧凑的顶栏/底栏）；select: 下拉选择 */
  variant?: "icon" | "select";
  size?: "small" | "default";
}

export function LanguageSwitcher({
  variant = "select",
  size = "small",
}: Props = {}) {
  const { i18n, t } = useTranslation();

  if (variant === "icon") {
    return (
      <Dropdown
        trigger="hover"
        position="bottomRight"
        render={
          <Dropdown.Menu>
            {SUPPORTED_LANGS.map((l) => (
              <Dropdown.Item key={l} onClick={() => void setLanguage(l)}>
                {t(`language.${l}`)}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        }
      >
        <Button
          theme="borderless"
          type="tertiary"
          size={size}
          icon={<IconLanguage />}
        />
      </Dropdown>
    );
  }

  return (
    <Select
      size={size}
      value={i18n.language as Lang}
      className="w-select"
      onChange={(v) => void setLanguage(v as Lang)}
      optionList={SUPPORTED_LANGS.map((l) => ({
        value: l,
        label: t(`language.${l}`),
      }))}
    />
  );
}
