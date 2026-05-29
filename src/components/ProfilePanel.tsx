import { useState } from "react";
import { Button, Input, List, Modal, Space, Tag, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";

export function ProfilePanel() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const addProfile = useProfileStore((s) => s.addProfile);
  const renameProfile = useProfileStore((s) => s.renameProfile);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const setActive = useProfileStore((s) => s.setActiveProfile);

  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null
  );

  const handleAdd = () => {
    const id = addProfile(t("options.newProfile"));
    setActive(id);
  };

  return (
    <div style={{ padding: 12 }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
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
              <List.Item
                style={{
                  cursor: "pointer",
                  background: isActive ? "var(--he-bg-selected)" : undefined,
                  borderRadius: 4,
                  padding: "8px 12px",
                }}
                onClick={() => setActive(p.id)}
                actions={[
                  <Button
                    key="rename"
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenaming({ id: p.id, name: p.name });
                    }}
                  />,
                  <Popconfirm
                    key="del"
                    title={t("options.deleteProfileConfirm")}
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      deleteProfile(p.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText={t("common.confirm")}
                    cancelText={t("common.cancel")}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <Space>
                  <Tag color={p.color} style={{ marginRight: 0 }}>
                    {p.rules.length}
                  </Tag>
                  <span>{p.name}</span>
                </Space>
              </List.Item>
            );
          }}
        />
      )}

      <Modal
        open={!!renaming}
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
          onChange={(e) =>
            setRenaming((prev) =>
              prev ? { ...prev, name: e.target.value } : prev
            )
          }
        />
      </Modal>
    </div>
  );
}
