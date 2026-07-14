import { useState, useRef, useEffect } from "react";

export interface FiltersButtonStatusOption {
  value: string;
  label: string;
}

interface FiltersButtonProps {
  statusOptions: FiltersButtonStatusOption[];
  selectedStatus: string | null;
  tagOptions: string[];
  selectedTags: string[];
  onStatusChange: (value: string | null) => void;
  onTagChange: (values: string[]) => void;
}

// single filter button that opens a popover with a single-select
// Status section (radio-style) and a multi-select Tags section
export function FiltersButton({
  statusOptions,
  selectedStatus,
  tagOptions,
  selectedTags,
  onStatusChange,
  onTagChange,
}: FiltersButtonProps) {
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

  const activeCount = (selectedStatus ? 1 : 0) + selectedTags.length;

  // single-select: clicking the active status deselects it
  const toggleStatus = (value: string) => {
    onStatusChange(selectedStatus === value ? null : value);
  };

  const toggleTag = (value: string) => {
    if (selectedTags.includes(value)) {
      onTagChange(selectedTags.filter((v) => v !== value));
    } else {
      onTagChange([...selectedTags, value]);
    }
  };

  const clearAll = () => {
    onStatusChange(null);
    onTagChange([]);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-medium text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-60 rounded border border-slate-200 bg-white py-2 shadow-lg">
          {activeCount > 0 && (
            <div className="px-3 pb-1">
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="px-3 pb-1 pt-1">
            <p className="text-xs font-medium uppercase text-slate-400">Status</p>
          </div>
          {statusOptions.map((option) => {
            const isSelected = selectedStatus === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleStatus(option.value)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span
                  className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                    isSelected ? "border-slate-900 bg-slate-900" : "border-slate-300"
                  }`}
                />
                {option.label}
              </button>
            );
          })}

          <div className="my-1 border-t border-slate-200" />

          <div className="px-3 pb-1 pt-1">
            <p className="text-xs font-medium uppercase text-slate-400">Tags</p>
          </div>
          {tagOptions.length === 0 ? (
            <p className="px-3 py-1.5 text-sm text-slate-400">
              No tags available
            </p>
          ) : (
            tagOptions.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
                >
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded-sm border ${
                      isSelected ? "border-slate-900 bg-slate-900" : "border-slate-300"
                    }`}
                  />
                  {tag}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default FiltersButton;
