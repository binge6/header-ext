import { useMemo, useState, type ReactNode } from "react";
import "./index.scss";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronsUpDown, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/utils/cn";
import { Scroller } from "../scroll";
import { Popover, PopoverContent, PopoverTrigger } from "../overlays";

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
        <Scroller className="he-command-list" defer={false}>
          <div className="he-command-list-content">
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
        </Scroller>
      </PopoverContent>
    </Popover>
  );
}
