interface Props {
  title: string;
  desc: string;
}

export function MenuItemLabel({ title, desc }: Props) {
  return (
    <div className="min-w-55 py-0.5">
      <div className="text-group-title font-semibold">{title}</div>
      <div className="mt-0.5 text-xs leading-4 text-muted-foreground">
        {desc}
      </div>
    </div>
  );
}
