import type { ReactNode } from "react";
import "./index.scss";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LoaderCircle, X } from "lucide-react";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/utils/cn";
import { Button } from "../controls";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="he-dialog-overlay" />
        <DialogPrimitive.Content className={cn("he-dialog-content", className)}>
          <div className="he-dialog-header">
            <DialogPrimitive.Title className="he-dialog-title">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="he-dialog-description">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <div className="he-dialog-body">{children}</div>
          {footer && <div className="he-dialog-footer">{footer}</div>}
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="he-dialog-close"
              aria-label={t("common.close")}
            >
              <X aria-hidden="true" />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="he-dialog-overlay" />
        <AlertDialogPrimitive.Content className="he-dialog-content">
          <div className="he-dialog-header">
            <AlertDialogPrimitive.Title className="he-dialog-title">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="he-dialog-description">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
          <div className="he-dialog-footer">
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={destructive ? "destructive" : "default"}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("he-spinner", className)} />;
}

export function Badge({
  children,
  variant = "secondary",
  className,
}: {
  children: ReactNode;
  variant?: "secondary" | "warning" | "success";
  className?: string;
}) {
  return (
    <span className={cn("he-badge", `he-badge-${variant}`, className)}>
      {children}
    </span>
  );
}

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{ className: "he-toast" }}
    />
  );
}
