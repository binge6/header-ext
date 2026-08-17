import { forwardRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/src/shared/lib/cn";

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
      className={cn(
        "z-90 w-max animate-in rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-panel fade-in zoom-in-95 animation-duration-150",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";
