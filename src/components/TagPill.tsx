interface TagPillProps {
  tag: string;
  // remove handler for editing/creating a card
  onDelete?: () => void;
}

export function TagPill({ tag, onDelete }: TagPillProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
      {tag}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove tag ${tag}`}
          className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          &times;
        </button>
      )}
    </span>
  );
}

export default TagPill;
