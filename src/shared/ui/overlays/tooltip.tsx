import { useState, type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  keepOpenOnClick?: boolean;
}

export function Tooltip({
  content,
  children,
  side = "top",
  disabled,
  open,
  onOpenChange,
  keepOpenOnClick,
}: TooltipProps) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const selfControlled = keepOpenOnClick && open === undefined;

  if (disabled) return children;

  const rootOpen = selfControlled ? hoverOpen : open;
  const hoverHandlers = selfControlled
    ? {
        onPointerEnter: () => setHoverOpen(true),
        onPointerLeave: () => setHoverOpen(false),
        onFocus: () => setHoverOpen(true),
        onBlur: () => setHoverOpen(false),
      }
    : undefined;

  return (
    <TooltipPrimitive.Root
      open={rootOpen}
      onOpenChange={selfControlled ? undefined : onOpenChange}
    >
      <TooltipPrimitive.Trigger asChild {...hoverHandlers}>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-100 max-w-tooltip-limit animate-in rounded-md bg-foreground/90 px-2.25 py-1.5 text-left text-xs leading-snug text-pretty text-background shadow-soft fade-in zoom-in-95 animation-duration-100"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-foreground/90" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export const UIProvider = TooltipPrimitive.Provider;
