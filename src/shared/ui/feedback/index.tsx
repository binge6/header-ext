import type { ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle, X } from "lucide-react";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/shared/lib/cn";
import { Button } from "../controls";

export { ErrorBoundary } from "./ErrorBoundary";

const badgeVariants = cva(
  "inline-flex min-h-5 items-center rounded-full px-1.75 py-0.5 text-micro leading-none font-bold",
  {
    variants: {
      variant: {
        secondary: "bg-secondary text-secondary-foreground",
        warning: "bg-warning-soft text-warning",
        success: "bg-success-soft text-success",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

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
        <DialogPrimitive.Overlay className="fixed inset-0 z-1000 animate-in bg-foreground/50 fade-in backdrop-blur-sm animation-duration-150" />
        <DialogPrimitive.Content
          className={cn(
            "he-dialog-content fixed top-1/2 left-1/2 z-1001 w-90 max-w-dialog-limit -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card text-card-foreground shadow-panel",
            className,
          )}
        >
          <div className="px-4 pt-4">
            <DialogPrimitive.Title className="m-0 text-dialog-title font-bold tracking-tight">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1.75 mb-0 text-group-title leading-relaxed text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <div className="px-4 py-3.5">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 px-4 pt-3.5 pb-4">
              {footer}
            </div>
          )}
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2.5 right-2.5"
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
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-1000 animate-in bg-foreground/50 fade-in backdrop-blur-sm animation-duration-150" />
        <AlertDialogPrimitive.Content className="he-dialog-content fixed top-1/2 left-1/2 z-1001 w-90 max-w-dialog-limit -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card text-card-foreground shadow-panel">
          <div className="px-4 pt-4">
            <AlertDialogPrimitive.Title className="m-0 text-dialog-title font-bold tracking-tight">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="mt-1.75 mb-0 text-group-title leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          </div>
          <div className="flex justify-end gap-2 px-4 pt-3.5 pb-4">
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
  return (
    <LoaderCircle
      className={cn(
        "he-spinner h-5.5 w-5.5 animate-spin text-primary",
        className,
      )}
    />
  );
}

export function Badge({
  children,
  variant = "secondary",
  className,
}: {
  children: ReactNode;
  variant?: VariantProps<typeof badgeVariants>["variant"];
  className?: string;
}) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
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
      toastOptions={{
        className: "!border-border !bg-popover !text-popover-foreground",
      }}
    />
  );
}
