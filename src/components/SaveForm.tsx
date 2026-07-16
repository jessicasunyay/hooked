import { useState, useEffect } from "react";
import type { Status, PatternCard } from "@/src/types";
import { usePatternsStore } from "@/src/store/patterns";
import { useSettingsStore } from "@/src/store/settings";
import { TagPill } from "./TagPill";

// status options for the dropdown
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "to-try", label: "To Try" },
  { value: "wip", label: "WIP" },
  { value: "completed", label: "Completed" },
];

interface SaveFormProps {
  // when the user cancels the save
  onDone?: () => void;
  // when the card has been saved (popup uses this to collapse + confirm)
  onSaved?: () => void;
}

export function SaveForm({ onDone, onSaved }: SaveFormProps) {
  // settings
  const defaultStatus = useSettingsStore((s) => s.defaultStatus);

  // form fields
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");

  // UI state
  const [loading, setLoading] = useState(true); // true while fetching active tab
  const [duplicate, setDuplicate] = useState<PatternCard | null>(null); // existing card with same URL, if any

  const cards = usePatternsStore((s) => s.cards);
  const addCard = usePatternsStore((s) => s.addCard);

  // prefill title + url from the active tab when the form mounts
  useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => {
        if (tab) {
          setTitle(tab.title ?? "");
          setUrl(tab.url ?? "");
        }
      })
      .catch((err) => console.error("[Hooked] Failed to query active tab:", err))
      .finally(() => setLoading(false));
  }, []);

  // tag helpers
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // enter or comma adds the tag
  // backspace on empty input removes the last one
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const doSave = () => {
    addCard({ title, url, status, tags, notes });
    onSaved?.();
  };

  //duplicate check
  const handleSaveClick = () => {
    const existing = cards.find((c) => c.url === url) ?? null;
    if (existing) {
      setDuplicate(existing);
    } else {
      doSave();
    }
  };

  const handleSaveAnyway = () => {
    setDuplicate(null);
    doSave();
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
    );
  }

  if (duplicate) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-medium text-amber-800">
          Already in your library
        </p>
        <p className="mt-1 text-xs text-amber-700">
          You saved &ldquo;{duplicate.title}&rdquo; on{" "}
          {new Date(duplicate.dateSaved).toLocaleDateString()}.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleSaveAnyway}
            className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            Save anyway
          </button>
          <button
            type="button"
            onClick={() => setDuplicate(null)}
            className="rounded border border-sand-dark px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-cream"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  //main form
  const canSave = title.trim() !== "" && url.trim() !== "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) handleSaveClick();
      }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500">Save this page</h2>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            aria-label="Cancel save"
            className="text-slate-400 hover:text-slate-700"
          >
            &times;
          </button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Pattern title"
          className="w-full rounded border border-sand-dark bg-white px-2 py-1 text-sm placeholder:text-slate-400 focus:border-brand-light focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="w-full rounded border border-sand-dark bg-white px-2 py-1 text-sm focus:border-brand-light focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tags</label>
        <div className="flex flex-wrap items-center gap-1 rounded border border-sand-dark bg-white px-2 py-1.5">
          {tags.map((tag) => (
            <TagPill key={tag} tag={tag} onDelete={() => removeTag(tag)} />
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={tags.length === 0 ? "Add tags…" : ""}
            className="min-w-[80px] flex-1 text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes"
          className="w-full rounded border border-sand-dark bg-white px-2 py-1 text-sm placeholder:text-slate-400 focus:border-brand-light focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!canSave}
        className="w-full rounded-lg bg-brand-light px-3 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save Pattern
      </button>
    </form>
  );
}

export default SaveForm;
