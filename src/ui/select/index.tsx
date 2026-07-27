import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import "./index.scss";
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
          className={cn("he-select-trigger", className)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className="he-select-value">
            {selectedOption ? (
              selectedOption.label
            ) : (
              <span className="he-control-placeholder">{placeholder}</span>
            )}
          </span>
          <ChevronDown aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="he-select-content"
        onKeyDown={handleContentKeyDown}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Scroller className="he-select-scroll" defer={false}>
          <div id={listboxId} role="listbox" className="he-select-list">
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
                  className="he-select-item"
                  onClick={() => selectValue(option.value)}
                  onFocus={() => setActiveIndex(index)}
                  onMouseMove={() => setActiveIndex(index)}
                >
                  <span className="he-select-item-label">{option.label}</span>
                  <span className="he-select-item-indicator">
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
