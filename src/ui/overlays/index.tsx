import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import "./index.scss";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Check } from "lucide-react";
import { cn } from "@/src/utils/cn";

export type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
  content,
  children,
  side = "top",
  disabled,
  open,
  onOpenChange,
}: TooltipProps) {
  if (disabled) return children;

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
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

interface TooltipDropdownMenuContextValue {
  open: boolean;
  tooltipOpen: boolean;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  handleTooltipOpenChange: (open: boolean) => void;
  handleTriggerPointerDown: () => void;
  handleTriggerPointerEnter: () => void;
  handleTriggerPointerLeave: () => void;
  handleTriggerFocus: () => void;
  handleContentCloseAutoFocus: (event: Event) => void;
}

const TooltipDropdownMenuContext =
  createContext<TooltipDropdownMenuContextValue | null>(null);

function useTooltipDropdownMenuContext(componentName: string) {
  const context = useContext(TooltipDropdownMenuContext);
  if (!context) {
    throw new Error(`${componentName} must be used inside TooltipDropdownMenu`);
  }
  return context;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}

function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => refs.forEach((ref) => assignRef(ref, node));
}

function composeEventHandlers<E extends { defaultPrevented?: boolean }>(
  userHandler: ((event: E) => void) | undefined,
  ourHandler: (event: E) => void,
) {
  return (event: E) => {
    userHandler?.(event);
    if (!event.defaultPrevented) ourHandler(event);
  };
}

export function TooltipDropdownMenu({
  children,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: DropdownMenuPrimitive.DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    defaultOpen ?? false,
  );
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipBlockedRef = useRef(false);
  const pointerOverTriggerRef = useRef(false);

  const open = controlledOpen ?? uncontrolledOpen;

  const blurTrigger = () => {
    const blur = () => triggerRef.current?.blur();
    if (typeof window === "undefined") {
      blur();
      return;
    }
    window.requestAnimationFrame(blur);
  };

  const hideTooltipAndBlurTrigger = () => {
    tooltipBlockedRef.current = true;
    setTooltipOpen(false);
    blurTrigger();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
    hideTooltipAndBlurTrigger();
  };

  const handleTooltipOpenChange = (nextOpen: boolean) => {
    if (open || tooltipBlockedRef.current) {
      setTooltipOpen(false);
      return;
    }
    setTooltipOpen(nextOpen);
  };

  const handleTriggerPointerDown = () => {
    pointerOverTriggerRef.current = true;
    tooltipBlockedRef.current = true;
    setTooltipOpen(false);
  };

  const handleTriggerPointerEnter = () => {
    pointerOverTriggerRef.current = true;
    if (!open) tooltipBlockedRef.current = false;
  };

  const handleTriggerPointerLeave = () => {
    pointerOverTriggerRef.current = false;
    setTooltipOpen(false);
  };

  const handleTriggerFocus = () => {
    if (tooltipBlockedRef.current && pointerOverTriggerRef.current) {
      blurTrigger();
      return;
    }
    if (!pointerOverTriggerRef.current) tooltipBlockedRef.current = false;
  };

  const handleContentCloseAutoFocus = (event: Event) => {
    event.preventDefault();
    hideTooltipAndBlurTrigger();
  };

  return (
    <TooltipDropdownMenuContext.Provider
      value={{
        open,
        tooltipOpen,
        triggerRef,
        handleTooltipOpenChange,
        handleTriggerPointerDown,
        handleTriggerPointerEnter,
        handleTriggerPointerLeave,
        handleTriggerFocus,
        handleContentCloseAutoFocus,
      }}
    >
      <DropdownMenuPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Root>
    </TooltipDropdownMenuContext.Provider>
  );
}

interface TooltipDropdownMenuTriggerProps
  extends Omit<DropdownMenuPrimitive.DropdownMenuTriggerProps, "asChild"> {
  tooltip?: ReactNode;
  tooltipSide?: TooltipSide;
  tooltipDisabled?: boolean;
}

export const TooltipDropdownMenuTrigger = forwardRef<
  HTMLElement,
  TooltipDropdownMenuTriggerProps
>(
  (
    {
      children,
      tooltip,
      tooltipSide = "top",
      tooltipDisabled,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const context = useTooltipDropdownMenuContext(
      "TooltipDropdownMenuTrigger",
    );

    const trigger = (
      <DropdownMenuPrimitive.Trigger
        ref={composeRefs(ref, context.triggerRef)}
        asChild
        onPointerDown={composeEventHandlers(
          onPointerDown as ((event: PointerEvent<HTMLElement>) => void) |
            undefined,
          context.handleTriggerPointerDown,
        )}
        onPointerEnter={composeEventHandlers(
          onPointerEnter as ((event: PointerEvent<HTMLElement>) => void) |
            undefined,
          context.handleTriggerPointerEnter,
        )}
        onPointerLeave={composeEventHandlers(
          onPointerLeave as ((event: PointerEvent<HTMLElement>) => void) |
            undefined,
          context.handleTriggerPointerLeave,
        )}
        onFocus={composeEventHandlers(
          onFocus as ((event: FocusEvent<HTMLElement>) => void) | undefined,
          context.handleTriggerFocus,
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Trigger>
    );

    if (!tooltip || tooltipDisabled) return trigger;

    return (
      <Tooltip
        content={tooltip}
        side={tooltipSide}
        open={context.open ? false : context.tooltipOpen}
        onOpenChange={context.handleTooltipOpenChange}
      >
        {trigger}
      </Tooltip>
    );
  },
);
TooltipDropdownMenuTrigger.displayName = "TooltipDropdownMenuTrigger";

export const TooltipDropdownMenuContent = forwardRef<
  HTMLDivElement,
  DropdownMenuPrimitive.DropdownMenuContentProps
>(({ onCloseAutoFocus, ...props }, ref) => {
  const context = useTooltipDropdownMenuContext(
    "TooltipDropdownMenuContent",
  );

  return (
    <DropdownMenuContent
      ref={ref}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event);
        context.handleContentCloseAutoFocus(event);
      }}
      {...props}
    />
  );
});
TooltipDropdownMenuContent.displayName = "TooltipDropdownMenuContent";

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
