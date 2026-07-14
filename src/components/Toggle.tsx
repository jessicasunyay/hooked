interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  autoFocus?: boolean;
}

export function Toggle({ checked, onChange, label, autoFocus }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      autoFocus={autoFocus}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span className="font-medium text-slate-700">{label}</span>
      <span
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          checked ? "bg-slate-900 justify-end" : "bg-slate-300 justify-start"
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow transition-transform" />
      </span>
    </button>
  );
}

export default Toggle;
