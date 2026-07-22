import {
  forwardRef,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/utils/cn";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "default" | "sm" | "icon" | "icon-sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "he-button",
        `he-button-${variant}`,
        `he-button-${size}`,
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn("he-input", className)}
    {...props}
  />
));
Input.displayName = "Input";

interface AutoCompleteInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "list"> {
  options: string[];
}

export const AutoCompleteInput = forwardRef<
  HTMLInputElement,
  AutoCompleteInputProps
>(({ options, ...props }, ref) => {
  const id = useId();

  return (
    <>
      <Input ref={ref} list={id} {...props} />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
});
AutoCompleteInput.displayName = "AutoCompleteInput";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn("he-switch", className)}
      onCheckedChange={onCheckedChange}
    >
      <SwitchPrimitive.Thumb className="he-switch-thumb" />
    </SwitchPrimitive.Root>
  );
}

interface CheckboxProps {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: CheckboxProps) {
  const control = (
    <CheckboxPrimitive.Root
      checked={checked}
      disabled={disabled}
      className="he-checkbox"
      onCheckedChange={(next) => onCheckedChange(next === true)}
    >
      <CheckboxPrimitive.Indicator>
        <Check aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return control;

  return (
    <label className={cn("he-checkbox-label", className)}>
      {control}
      <span>{label}</span>
    </label>
  );
}

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  side = "top",
  disabled,
}: TooltipProps) {
  if (disabled) return children;

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="he-tooltip"
        >
          {content}
          <TooltipPrimitive.Arrow className="he-tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export const UIProvider = TooltipPrimitive.Provider;

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuContentProps
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn("he-menu-content", className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps
  extends DropdownMenuPrimitive.DropdownMenuItemProps {
  destructive?: boolean;
}

export const DropdownMenuItem = forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "he-menu-item",
      destructive && "he-menu-item-destructive",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuLabelProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("he-menu-label", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("he-menu-separator", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuRadioItem = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuRadioItemProps
>(({ children, className, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn("he-menu-item he-menu-radio-item", className)}
    {...props}
  >
    <span className="he-menu-item-indicator">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = forwardRef<
  HTMLDivElement,
  PopoverPrimitive.PopoverContentProps
>(({ className, sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn("he-popover-content", className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectControlProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function SelectControl({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
  "aria-label": ariaLabel,
}: SelectControlProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn("he-select-trigger", className)}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className="he-select-content"
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="he-select-item"
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

interface MultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  allowCreate?: boolean;
  maxVisible?: number;
}

export function MultiSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  allowCreate,
  maxVisible = 3,
}: MultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const mergedOptions = useMemo(() => {
    const byValue = new Map(options.map((option) => [option.value, option]));
    value.forEach((item) => {
      if (!byValue.has(item)) byValue.set(item, { value: item, label: item });
    });
    return Array.from(byValue.values());
  }, [options, value]);
  const visibleOptions = mergedOptions.filter((option) =>
    option.value.toLowerCase().includes(normalizedQuery),
  );
  const canCreate =
    allowCreate &&
    query.trim().length > 0 &&
    !mergedOptions.some(
      (option) => option.value.toLowerCase() === normalizedQuery,
    );

  const toggleValue = (nextValue: string) => {
    if (value.includes(nextValue)) {
      onValueChange(value.filter((item) => item !== nextValue));
    } else {
      onValueChange([...value, nextValue]);
    }
  };

  const createValue = () => {
    const nextValue = query.trim();
    if (!nextValue) return;
    onValueChange([...value, nextValue]);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("he-multi-select-trigger", className)}
          aria-expanded={open}
        >
          <span className="he-multi-select-value">
            {value.length === 0 ? (
              <span className="he-control-placeholder">{placeholder}</span>
            ) : (
              <>
                {value.slice(0, maxVisible).map((item) => (
                  <span key={item} className="he-chip">
                    {item}
                  </span>
                ))}
                {value.length > maxVisible && (
                  <span className="he-chip">+{value.length - maxVisible}</span>
                )}
              </>
            )}
          </span>
          <ChevronsUpDown aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="he-multi-select-content"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="he-command-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            placeholder={placeholder}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canCreate) {
                event.preventDefault();
                createValue();
              }
            }}
          />
          {query && (
            <button
              type="button"
              aria-label={t("common.clear")}
              onClick={() => setQuery("")}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="he-command-list">
          {canCreate && (
            <button
              type="button"
              className="he-command-item"
              onClick={createValue}
            >
              <span className="he-command-check" />
              <span>{query.trim()}</span>
            </button>
          )}
          {visibleOptions.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className="he-command-item"
                onClick={() => toggleValue(option.value)}
              >
                <span
                  className={cn(
                    "he-command-check",
                    selected && "he-command-check-selected",
                  )}
                >
                  {selected && <Check aria-hidden="true" />}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
          {!canCreate && visibleOptions.length === 0 && (
            <div className="he-command-empty">{t("common.noResults")}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
        <DialogPrimitive.Content
          className={cn("he-dialog-content", className)}
        >
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
