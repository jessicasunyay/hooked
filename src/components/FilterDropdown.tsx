import { useState, useRef, useEffect } from "react";

export interface FilterOption {
  value: string; // what the parent uses for matching/filtering
  label: string; // what the user sees
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValue: string | null;
  selectedValues: string[];
  multi?: boolean;
  onChange: (selectedValue: string | null, selectedValues: string[]) => void;
}

// reusable dropdown for filtering the card list
export function FilterDropdown({
  label,
  options,
  selectedValue,
  selectedValues,
  multi = false,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // summary text for the toggle button
  const summary = multi
    ? selectedValues.length === 0
      ? label
      : selectedValues.length === 1
        ? options.find((o) => o.value === selectedValues[0])?.label ?? label
        : `${selectedValues.length} selected`
    : selectedValue
      ? options.find((o) => o.value === selectedValue)?.label ?? label
      : label;

  const handleSingleSelect = (value: string) => {
    // deselecting
    if (selectedValue === value) {
      onChange(null, []);
    } else {
      onChange(value, []);
    }
    setOpen(false);
  };

  const handleMultiToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(null, selectedValues.filter((v) => v !== value));
    } else {
      onChange(null, [...selectedValues, value]);
    }
    // stay open so the user can pick multiple without reopening
  };

  const clearAll = () => {
    onChange(null, []);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded border border-sand-dark bg-white px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-cream dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {summary}
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded border border-sand-light bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {multi && selectedValues.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="block w-full px-3 py-1 text-left text-xs text-slate-500 hover:bg-cream dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Clear all
            </button>
          )}

          {options.map((option) => {
            const isSelected = multi
              ? selectedValues.includes(option.value)
              : selectedValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  multi
                    ? handleMultiToggle(option.value)
                    : handleSingleSelect(option.value)
                }
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-cream dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span
                  className={`h-3.5 w-3.5 shrink-0 border ${
                    multi ? "rounded-sm" : "rounded-full"
                  } ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 dark:border-white dark:bg-white"
                      : "border-sand-dark dark:border-slate-600"
                  }`}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
