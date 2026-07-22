import { Copy, Edit3, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/ui/overlays";

interface Props {
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProfileContextMenuContent({
  onRename,
  onDuplicate,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  return (
    <DropdownMenuContent align="start" className="w-52">
      <DropdownMenuItem onClick={onRename}>
        <Edit3 aria-hidden="true" />
        {t("options.renameProfile")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onDuplicate}>
        <Copy aria-hidden="true" />
        {t("options.copyProfile")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive onClick={onDelete}>
        <Trash2 aria-hidden="true" />
        {t("options.deleteProfile")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
