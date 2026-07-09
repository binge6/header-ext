// 下拉菜单项的「标题 + 描述」两行布局，供 filter / 模板等菜单复用
import { Typography } from "@douyinfe/semi-ui";

interface Props {
  title: string;
  desc: string;
}

export function MenuItemLabel({ title, desc }: Props) {
  return (
    <div className="min-w-55">
      <div className="text-group-title font-medium">{title}</div>
      <Typography.Text type="tertiary" size="small">
        {desc}
      </Typography.Text>
    </div>
  );
}
