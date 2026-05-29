import { Button, Dropdown, Select } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { setLanguage, SUPPORTED_LANGS, type Lang } from "@/src/i18n";

interface Props {
  /** icon: 仅图标按钮（适合空间紧凑的顶栏/底栏）；select: 下拉选择 */
  variant?: "icon" | "select";
  size?: "small" | "middle";
}

export function LanguageSwitcher({
  variant = "select",
  size = "small",
}: Props = {}) {
  const { i18n, t } = useTranslation();

  if (variant === "icon") {
    const items = SUPPORTED_LANGS.map((l) => ({
      key: l,
      label: t(`language.${l}`),
      onClick: () => void setLanguage(l),
    }));
    return (
      <Dropdown
        menu={{ items, selectedKeys: [i18n.language] }}
        trigger={["hover", "click"]}
        placement="bottomRight"
      >
        <Button type="text" size={size} icon={<GlobalOutlined />} />
      </Dropdown>
    );
  }

  return (
    <Select
      size={size}
      value={i18n.language as Lang}
      style={{ width: 130 }}
      onChange={(v) => void setLanguage(v as Lang)}
      options={SUPPORTED_LANGS.map((l) => ({
        value: l,
        label: t(`language.${l}`),
      }))}
    />
  );
}
