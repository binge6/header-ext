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
} from "react";
import "./index.scss";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, Minus } from "lucide-react";
import { cn } from "@/src/shared/lib/cn";
import { Scroller } from "../scroll";
import { Popover, PopoverAnchor, PopoverContent } from "../overlays";

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
      commitValue(suggestions[activeIndex] ?? suggestions[0]);
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
        className="he-autocomplete-content"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Scroller className="he-autocomplete-scroll" defer={false}>
          <div className="he-autocomplete-list">
            {suggestions.map((option, index) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "he-autocomplete-item",
                  index === activeIndex && "he-autocomplete-item-active",
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
      className={cn("he-switch", className)}
      onCheckedChange={onCheckedChange}
    >
      <SwitchPrimitive.Thumb className="he-switch-thumb" />
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
        className={cn("he-checkbox", !label && className)}
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
      <label className={cn("he-checkbox-label", className)}>
        {control}
        <span>{label}</span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
