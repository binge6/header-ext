import { useState } from "react";
import {
  Button,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Popconfirm,
} from "@douyinfe/semi-ui";
import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag";
import { IconPlus, IconEdit, IconDelete } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";

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

export function ProfilePanel() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const {
    addProfile,
    renameProfile,
    deleteProfile,
    setActiveProfile: setActive,
  } = useProfileActions();

  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null
  );

  const handleAdd = () => {
    const id = addProfile();
    setActive(id);
  };

  return (
    <div style={{ padding: 12 }}>
      <Button
        theme="solid"
        type="primary"
        icon={<IconPlus />}
        block
        onClick={handleAdd}
        style={{ marginBottom: 12 }}
      >
        {t("options.newProfile")}
      </Button>

      {profiles.length === 0 ? (
        <div
          style={{
            color: "var(--he-text-tertiary)",
            textAlign: "center",
            padding: 24,
          }}
        >
          {t("options.noProfiles")}
        </div>
      ) : (
        <List
          size="small"
          dataSource={profiles}
          renderItem={(p) => {
            const isActive = p.id === activeId;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  background: isActive ? "var(--he-bg-selected)" : undefined,
                  borderRadius: 4,
                  padding: "8px 12px",
                }}
                onClick={() => setActive(p.id)}
              >
                <Space>
                  <Tag color={mapTagColor(p.color)} style={{ marginRight: 0 }}>
                    {p.rules.length}
                  </Tag>
                  <span>{p.name}</span>
                </Space>
                <Space spacing={4}>
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    icon={<IconEdit />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenaming({ id: p.id, name: p.name });
                    }}
                  />
                  <Popconfirm
                    title={t("options.deleteProfileConfirm")}
                    onConfirm={() => {
                      deleteProfile(p.id);
                    }}
                    okText={t("common.confirm")}
                    cancelText={t("common.cancel")}
                  >
                    <Button
                      theme="borderless"
                      type="danger"
                      size="small"
                      icon={<IconDelete />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </Space>
              </div>
            );
          }}
        />
      )}

      <Modal
        visible={!!renaming}
        title={t("options.renameProfile")}
        onCancel={() => setRenaming(null)}
        onOk={() => {
          if (renaming) {
            renameProfile(renaming.id, renaming.name.trim() || "Untitled");
            setRenaming(null);
          }
        }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
      >
        <Input
          value={renaming?.name ?? ""}
          onChange={(v) =>
            setRenaming((prev) => (prev ? { ...prev, name: v } : prev))
          }
        />
      </Modal>
    </div>
  );
}
