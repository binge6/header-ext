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
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import { cn } from "@/src/shared/lib/cn";
import { Scroller } from "../scroll";
import { Tooltip, type TooltipSide } from "./tooltip";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const menuItemVariants = cva(
  "relative flex min-h-8.5 w-full cursor-pointer items-center gap-2.25 rounded-md border-0 bg-transparent px-2.25 py-1.75 text-left text-group-title leading-snug text-foreground outline-none select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-45 data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:h-3.75 [&_svg]:w-3.75 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
  {
    variants: {
      destructive: {
        true: "text-destructive hover:bg-destructive/10 hover:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive",
        false: "",
      },
    },
    defaultVariants: {
      destructive: false,
    },
  },
);

interface MenuButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menuItemVariants> {}

export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ className, destructive, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(menuItemVariants({ destructive }), className)}
      {...props}
    />
  ),
);
MenuButton.displayName = "MenuButton";

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

interface TooltipDropdownMenuTriggerProps extends Omit<
  DropdownMenuPrimitive.DropdownMenuTriggerProps,
  "asChild"
> {
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
    const context = useTooltipDropdownMenuContext("TooltipDropdownMenuTrigger");

    const trigger = (
      <DropdownMenuPrimitive.Trigger
        ref={composeRefs(ref, context.triggerRef)}
        asChild
        onPointerDown={composeEventHandlers(
          onPointerDown as
            | ((event: PointerEvent<HTMLElement>) => void)
            | undefined,
          context.handleTriggerPointerDown,
        )}
        onPointerEnter={composeEventHandlers(
          onPointerEnter as
            | ((event: PointerEvent<HTMLElement>) => void)
            | undefined,
          context.handleTriggerPointerEnter,
        )}
        onPointerLeave={composeEventHandlers(
          onPointerLeave as
            | ((event: PointerEvent<HTMLElement>) => void)
            | undefined,
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
  const context = useTooltipDropdownMenuContext("TooltipDropdownMenuContent");

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
>(({ className, children, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn(
        "z-90 min-w-40 max-w-80 animate-in overflow-hidden rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-panel fade-in zoom-in-95 animation-duration-150",
        className,
      )}
      {...props}
    >
      <Scroller className="max-h-menu-height" defer={false}>
        <div className="p-1.25">{children}</div>
      </Scroller>
    </DropdownMenuPrimitive.Content>
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
    className={cn(menuItemVariants({ destructive }), className)}
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
    className={cn(
      "px-2.25 pt-1.75 pb-1.25 text-micro font-bold tracking-wide text-muted-foreground uppercase",
      className,
    )}
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
    className={cn("-mx-px my-1.25 h-px bg-border", className)}
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
    className={cn(
      "relative flex min-h-8.5 w-full cursor-pointer items-center gap-2.25 rounded-md border-0 bg-transparent py-1.75 pr-2.25 pl-8 text-left text-group-title leading-snug text-foreground outline-none select-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:h-3.75 [&_svg]:w-3.75 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 inline-flex items-center [&_svg]:text-primary">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";
