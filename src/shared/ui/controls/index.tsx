import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { cn } from "@/src/shared/lib/cn";
import { Scroller } from "../scroll";
import { Popover, PopoverAnchor, PopoverContent } from "../overlays";

const buttonVariants = cva(
  "he-button inline-flex min-w-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-transparent font-semibold leading-none transition-colors outline-none active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-3 focus-visible:ring-ring/25 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary !text-primary-foreground shadow-soft hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-border bg-card text-foreground shadow-soft hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive !text-destructive-foreground hover:bg-destructive-hover",
      },
      size: {
        default: "h-9 gap-2 px-3.5 text-group-title",
        sm: "h-8 gap-1.5 rounded-sm px-2.5 text-xs",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7.5 w-7.5 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

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
      className={cn(buttonVariants({ variant, size }), className)}
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
    className={cn(
      "he-input h-8.5 w-full min-w-0 rounded-sm border border-input bg-card px-2.5 text-group-title leading-8.5 text-foreground shadow-soft outline-none transition-colors placeholder:text-muted-foreground/80 hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/25 [&::-webkit-calendar-picker-indicator]:hidden",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "he-textarea min-h-32 w-full min-w-0 resize-y rounded-sm border border-input bg-card px-2.5 py-2 text-group-title leading-5 text-foreground shadow-soft outline-none transition-colors placeholder:text-muted-foreground/80 hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/25",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

interface AutoCompleteInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "list"
> {
  options: string[];
}

export const AutoCompleteInput = forwardRef<
  HTMLInputElement,
  AutoCompleteInputProps
>(({ options, value, onChange, onBlur, onFocus, onKeyDown, ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputValue = String(value ?? "");
  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    return Array.from(new Set(options))
      .filter((option) => !query || option.toLowerCase().includes(query))
      .slice(0, 8);
  }, [inputValue, options]);
  const showSuggestions = open && suggestions.length > 0;

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const commitValue = (nextValue: string) => {
    const input = inputRef.current;
    if (!input) return;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    );
    descriptor?.set?.call(input, nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setOpen(false);
    input.focus();
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setOpen(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    window.setTimeout(() => setOpen(false), 100);
    onBlur?.(event);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setActiveIndex(0);
    setOpen(true);
    onChange?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }
    if (showSuggestions && event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (showSuggestions && event.key === "Enter") {
      event.preventDefault();
      const suggestion = suggestions[activeIndex] ?? suggestions[0];
      if (suggestion) commitValue(suggestion);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
    onKeyDown?.(event);
  };

  return (
    <Popover open={showSuggestions}>
      <PopoverAnchor asChild>
        <Input
          ref={setRefs}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-autocomplete min-w-autocomplete-min max-w-autocomplete-max overflow-hidden p-0.75"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Scroller className="max-h-autocomplete-height" defer={false}>
          <div>
            {suggestions.map((option, index) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "block min-h-6.5 w-full cursor-pointer overflow-hidden rounded-sm border-0 bg-transparent px-1.75 py-1 text-left text-xs leading-snug font-semibold text-ellipsis whitespace-nowrap text-popover-foreground",
                  index === activeIndex && "bg-accent text-accent-foreground",
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  commitValue(option);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </Scroller>
      </PopoverContent>
    </Popover>
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
      className={cn(
        "he-switch relative inline-flex h-4.75 w-8.5 shrink-0 cursor-pointer items-center rounded-full border-0 bg-muted-foreground/35 p-0.5 outline-none transition-colors data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/25",
        className,
      )}
      onCheckedChange={onCheckedChange}
    >
      <SwitchPrimitive.Thumb className="block h-3.75 w-3.75 translate-x-0 rounded-full bg-white shadow-soft transition-transform data-[state=checked]:translate-x-3.75" />
    </SwitchPrimitive.Root>
  );
}

interface CheckboxProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      checked,
      onCheckedChange,
      label,
      disabled,
      className,
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const control = (
      <CheckboxPrimitive.Root
        ref={ref}
        type={type}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "he-checkbox inline-flex h-4.25 w-4.25 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-input bg-card text-primary-foreground outline-none data-[checkbox-state=checked]:border-primary data-[checkbox-state=checked]:bg-primary data-[checkbox-state=indeterminate]:border-primary data-[checkbox-state=indeterminate]:bg-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/25 [&_svg]:h-3.25 [&_svg]:w-3.25 [&_svg]:stroke-2.5",
          !label && className,
        )}
        onCheckedChange={(next) => onCheckedChange(next === true)}
        {...props}
        data-checkbox-state={
          checked === true ? "checked" : checked || "unchecked"
        }
      >
        <CheckboxPrimitive.Indicator>
          {checked === "indeterminate" ? (
            <Minus aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!label) return control;

    return (
      <label
        className={cn(
          "he-checkbox-label flex cursor-pointer items-center gap-2 text-group-title text-foreground",
          className,
        )}
      >
        {control}
        <span>{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
