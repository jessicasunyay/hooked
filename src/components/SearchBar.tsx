import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  onSearch: (term: string) => void;
  // how long to wait after the last keystroke before firing onSearch
  debounceMs?: number;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  debounceMs = 250,
  placeholder = "Search…",
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // clear any pending timer from a previous keystroke
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    // set a new timer
    timerRef.current = window.setTimeout(() => {
      onSearch(inputValue);
      timerRef.current = null;
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [inputValue, debounceMs, onSearch]);

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded border border-sand-dark bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-light focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
    />
  );
}

export default SearchBar;
