import { Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";

interface Props {
  title: string;
  addLabel: string;
  onAdd: () => void;
}

/** 规则/过滤分组的通用标题栏：左侧标题 + 右侧「新增」按钮 */
export function GroupHeader({ title, addLabel, onAdd }: Props) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-group-title font-semibold">{title}</span>
      <Button
        theme="borderless"
        type="tertiary"
        size="small"
        icon={<IconPlus />}
        onClick={onAdd}
      >
        {addLabel}
      </Button>
    </div>
  );
}
