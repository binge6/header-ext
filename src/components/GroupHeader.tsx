import { Plus } from "lucide-react";
import { Button } from "@/src/ui";

interface Props {
  title: string;
  addLabel: string;
  onAdd: () => void;
}

/** 规则/过滤分组的通用标题栏：左侧标题 + 右侧「新增」按钮 */
export function GroupHeader({ title, addLabel, onAdd }: Props) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="he-section-title">{title}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
      >
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}
