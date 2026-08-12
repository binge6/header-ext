import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown, ChevronsUpDown, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/shared/lib/cn";
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
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption = options.find((option) => option.value === value);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  );

  useEffect(() => {
    if (open) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, open]);

  const focusTrigger = () => {
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
    });
  };

  const selectValue = (nextValue: string) => {
    if (nextValue !== value) onValueChange(nextValue);
    setOpen(false);
    focusTrigger();
  };

  const moveActive = (nextIndex: number) => {
    if (options.length === 0) return;
    setActiveIndex((nextIndex + options.length) % options.length);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      moveActive(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      moveActive(selectedIndex >= 0 ? selectedIndex : options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleContentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      focusTrigger();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(activeIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(activeIndex - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      moveActive(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      moveActive(options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const activeOption = options[activeIndex];
      if (activeOption) selectValue(activeOption.value);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          data-state={open ? "open" : "closed"}
          className={cn(
            "he-select-trigger inline-flex h-8.5 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm border border-input bg-card px-2.25 text-group-title text-foreground shadow-soft outline-none transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
            className,
          )}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="he-select-value min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
            {selectedOption ? (
              selectedOption.label
            ) : (
              <span className="text-muted-foreground/80">{placeholder}</span>
            )}
          </span>
          <ChevronDown aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-select-content max-h-select-content overflow-hidden p-0"
        onKeyDown={handleContentKeyDown}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Scroller className="max-h-select-content" defer={false}>
          <div id={listboxId} role="listbox" className="p-1.25">
            {options.map((option, index) => {
              const selected = option.value === value;
              const highlighted = index === activeIndex;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-state={selected ? "checked" : "unchecked"}
                  data-highlighted={highlighted ? "" : undefined}
                  className="relative flex min-h-8 w-full cursor-pointer items-center justify-between gap-2.5 rounded-md border-0 bg-transparent px-2 py-1.5 text-left text-group-title text-inherit outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  onClick={() => selectValue(option.value)}
                  onFocus={() => setActiveIndex(index)}
                  onMouseMove={() => setActiveIndex(index)}
                >
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {option.label}
                  </span>
                  <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-primary">
                    {selected && <Check aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </Scroller>
      </PopoverContent>
    </Popover>
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
          className={cn(
            "he-multi-select-trigger flex min-h-8.5 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm border border-input bg-card px-2 py-1 text-left text-foreground shadow-soft outline-none transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/25 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
            className,
          )}
          aria-expanded={open}
        >
          <span className="he-multi-select-value flex min-w-0 flex-1 flex-wrap items-center gap-1 text-xs">
            {value.length === 0 ? (
              <span className="text-muted-foreground/80">{placeholder}</span>
            ) : (
              <>
                {value.slice(0, maxVisible).map((item) => (
                  <span
                    key={item}
                    className="he-chip inline-flex h-5.5 max-w-32.5 items-center overflow-hidden rounded-md bg-secondary px-1.5 text-ellipsis whitespace-nowrap text-secondary-foreground"
                  >
                    {item}
                  </span>
                ))}
                {value.length > maxVisible && (
                  <span className="he-chip inline-flex h-5.5 max-w-32.5 items-center overflow-hidden rounded-md bg-secondary px-1.5 text-ellipsis whitespace-nowrap text-secondary-foreground">
                    +{value.length - maxVisible}
                  </span>
                )}
              </>
            )}
          </span>
          <ChevronsUpDown aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-multi-select-content p-1.25"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-1.75 border-b border-border px-1.25 pt-0.75 pb-2 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-muted-foreground">
          <Search aria-hidden="true" className="shrink-0" />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-xs text-foreground outline-none"
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
              className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-muted-foreground"
              aria-label={t("common.clear")}
              onClick={() => setQuery("")}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
        <Scroller className="max-h-command-list" defer={false}>
          <div className="pt-1">
            {canCreate && (
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1.5 py-1.75 text-left text-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={createValue}
              >
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input" />
                <span>{query.trim()}</span>
              </button>
            )}
            {visibleOptions.map((option) => {
              const selected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1.5 py-1.75 text-left text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => toggleValue(option.value)}
                >
                  <span
                    className={cn(
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input [&_svg]:h-3 [&_svg]:w-3",
                      selected &&
                        "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {selected && <Check aria-hidden="true" />}
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
            {!canCreate && visibleOptions.length === 0 && (
              <div className="px-2 py-4.5 text-center text-xs text-muted-foreground">
                {t("common.noResults")}
              </div>
            )}
          </div>
        </Scroller>
      </PopoverContent>
    </Popover>
  );
}
