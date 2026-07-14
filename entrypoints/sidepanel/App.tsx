import { useState, useMemo, useEffect } from "react";
import type { Status, PatternCard } from "@/src/types";
import { usePatternsStore } from "@/src/store/patterns";
import { useCardImage, FALLBACK_IMAGE } from "@/src/lib/image";
import { Card } from "@/src/components/Card";
import { EmptyState } from "@/src/components/EmptyState";
import { SearchBar } from "@/src/components/SearchBar";
import { FiltersButton } from "@/src/components/FiltersButton";
import { StatusBadge } from "@/src/components/StatusBadge";
import { TagPill } from "@/src/components/TagPill";

// status options for the edit form dropdown + filter button
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "to-try", label: "To Try" },
  { value: "wip", label: "WIP" },
  { value: "completed", label: "Completed" },
];

type View = "list" | "detail"; // card list v. card details
type DetailMode = "view" | "edit"; // viewing v. editing
function App() {
  const cards = usePatternsStore((s) => s.cards);
  const updateCard = usePatternsStore((s) => s.updateCard);
  const deleteCard = usePatternsStore((s) => s.deleteCard);

  // rehydrate the store when another context (e.g. the popup) saves a card,
  // so the side panel updates live without needing to be reopened
  useEffect(() => {
    const handleStorageChange = (
      _changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName === "local") {
        usePatternsStore.persist.rehydrate();
      }
    };
    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // list view state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  // detail view state
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>("view");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<Status>("to-try");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // all tags currently in use across all cards
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [cards]);

  // filtered + sorted (newest first) card list
  const filteredCards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return cards
      .filter((card) => {
        // search term match
        if (term) {
          const hostname = safeHostname(card.url);
          const haystack = [
            card.title,
            card.notes,
            card.tags.join(" "),
            hostname,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }

        // status filter (single-select)
        if (statusFilter && card.status !== statusFilter) return false;

        // tag filter
        if (tagFilter.length > 0) {
          if (!tagFilter.some((t) => card.tags.includes(t))) return false;
        }

        return true;
      })
      .sort((a, b) => b.dateSaved - a.dateSaved);
  }, [cards, searchTerm, statusFilter, tagFilter]);

  const selectedCard = cards.find((c) => c.id === selectedId) ?? null;

  // handlers
  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailMode("view");
    setConfirmDelete(false);
    setView("detail");
  };

  const backToList = () => {
    setView("list");
    setSelectedId(null);
    setDetailMode("view");
    setConfirmDelete(false);
  };

  // enter edit mode
  const startEdit = () => {
    if (!selectedCard) return;
    setEditTitle(selectedCard.title);
    setEditStatus(selectedCard.status);
    setEditTags([...selectedCard.tags]);
    setEditTagInput("");
    setEditNotes(selectedCard.notes);
    setDetailMode("edit");
  };

  const cancelEdit = () => {
    setDetailMode("view");
  };

  const saveEdit = () => {
    if (!selectedCard) return;
    updateCard(selectedCard.id, {
      title: editTitle,
      status: editStatus,
      tags: editTags,
      notes: editNotes,
    });
    setDetailMode("view");
  };

  const handleDelete = () => {
    if (!selectedCard) return;
    deleteCard(selectedCard.id);
    backToList();
  };

  const openUrl = () => {
    if (!selectedCard) return;
    browser.tabs.create({ url: selectedCard.url });
  };

  // edit form tag helpers

  const addEditTag = () => {
    const trimmed = editTagInput.trim();
    if (
      trimmed &&
      !editTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setEditTags([...editTags, trimmed]);
    }
    setEditTagInput("");
  };

  const removeEditTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  const handleEditTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEditTag();
    } else if (
      e.key === "Backspace" &&
      editTagInput === "" &&
      editTags.length > 0
    ) {
      setEditTags(editTags.slice(0, -1));
    }
  };

  // render

  if (view === "detail" && selectedCard) {
    return (
      <DetailView
        card={selectedCard}
        mode={detailMode}
        confirmDelete={confirmDelete}
        onBack={backToList}
        onEdit={startEdit}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEdit}
        onDelete={() => setConfirmDelete(true)}
        onConfirmDelete={handleDelete}
        onCancelDelete={() => setConfirmDelete(false)}
        onOpenUrl={openUrl}
        editTitle={editTitle}
        editStatus={editStatus}
        editTags={editTags}
        editTagInput={editTagInput}
        editNotes={editNotes}
        setEditTitle={setEditTitle}
        setEditStatus={setEditStatus}
        setEditTagInput={setEditTagInput}
        setEditNotes={setEditNotes}
        addEditTag={addEditTag}
        removeEditTag={removeEditTag}
        handleEditTagKeyDown={handleEditTagKeyDown}
      />
    );
  }

  return (
    <ListView
      cards={cards}
      filteredCards={filteredCards}
      statusFilter={statusFilter}
      tagFilter={tagFilter}
      tagOptions={allTags}
      onSearch={setSearchTerm}
      onStatusChange={setStatusFilter}
      onTagChange={setTagFilter}
      onCardClick={openDetail}
    />
  );
}

// extracts hostname
function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ListView

interface ListViewProps {
  cards: PatternCard[];
  filteredCards: PatternCard[];
  statusFilter: string | null;
  tagFilter: string[];
  tagOptions: string[];
  onSearch: (term: string) => void;
  onStatusChange: (value: string | null) => void;
  onTagChange: (values: string[]) => void;
  onCardClick: (id: string) => void;
}

function ListView({
  cards,
  filteredCards,
  statusFilter,
  tagFilter,
  tagOptions,
  onSearch,
  onStatusChange,
  onTagChange,
  onCardClick,
}: ListViewProps) {
  const hasCards = cards.length > 0;
  const hasResults = filteredCards.length > 0;

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-bold">
          Pattern Library
          {cards.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({cards.length})
            </span>
          )}
        </h1>
      </header>

      {hasCards && (
        <div className="flex gap-2 border-b border-slate-200 px-4 py-3">
          <div className="flex-1">
            <SearchBar onSearch={onSearch} placeholder="Search title, tags, notes…" />
          </div>
          <FiltersButton
            statusOptions={STATUS_OPTIONS}
            selectedStatus={statusFilter}
            tagOptions={tagOptions}
            selectedTags={tagFilter}
            onStatusChange={onStatusChange}
            onTagChange={onTagChange}
          />
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4">
        {!hasCards ? (
          <EmptyState
            title="No patterns saved yet."
            subtitle="Click the Hooked icon on a pattern page to save it."
          />
        ) : !hasResults ? (
          <EmptyState
            title="No patterns match your filters."
            subtitle="Try adjusting your search or filters."
          />
        ) : (
          <div className="space-y-3">
            {filteredCards.map((card) => (
              <Card key={card.id} card={card} onClick={() => onCardClick(card.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// DetailView

interface DetailViewProps {
  card: PatternCard;
  mode: DetailMode;
  confirmDelete: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onOpenUrl: () => void;
  // edit form state (passed down so the parent owns the form values)
  editTitle: string;
  editStatus: Status;
  editTags: string[];
  editTagInput: string;
  editNotes: string;
  setEditTitle: (v: string) => void;
  setEditStatus: (v: Status) => void;
  setEditTagInput: (v: string) => void;
  setEditNotes: (v: string) => void;
  addEditTag: () => void;
  removeEditTag: (tag: string) => void;
  handleEditTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function DetailView({
  card,
  mode,
  confirmDelete,
  onBack,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onOpenUrl,
  editTitle,
  editStatus,
  editTags,
  editTagInput,
  editNotes,
  setEditTitle,
  setEditStatus,
  setEditTagInput,
  setEditNotes,
  addEditTag,
  removeEditTag,
  handleEditTagKeyDown,
}: DetailViewProps) {
  const imgSrc = useCardImage(card.url);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          &larr; Back
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {mode === "edit" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveEdit();
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Status)}
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
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
              <div className="flex flex-wrap items-center gap-1 rounded border border-slate-300 px-2 py-1.5">
                {editTags.map((tag) => (
                  <TagPill
                    key={tag}
                    tag={tag}
                    onDelete={() => removeEditTag(tag)}
                  />
                ))}
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={handleEditTagKeyDown}
                  onBlur={addEditTag}
                  placeholder={editTags.length === 0 ? "Add tags…" : ""}
                  className="min-w-[80px] flex-1 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <img
                src={imgFailed ? FALLBACK_IMAGE : imgSrc}
                alt={card.title}
                onError={() => setImgFailed(true)}
                className="h-16 w-16 shrink-0 rounded-md object-contain bg-slate-50"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-slate-900">
                  {card.title}
                </h2>
                <p className="truncate text-xs text-slate-400">
                  {safeHostname(card.url)}
                </p>
                <div className="mt-2">
                  <StatusBadge status={card.status} />
                </div>
              </div>
            </div>

            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} />
                ))}
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase text-slate-400">
                Saved
              </p>
              <p className="text-sm text-slate-700">
                {new Date(card.dateSaved).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {card.notes && (
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {card.notes}
                </p>
              </div>
            )}

            <div className="space-y-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onOpenUrl}
                className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Open URL
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                {confirmDelete ? (
                  <>
                    <button
                      type="button"
                      onClick={onConfirmDelete}
                      className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={onCancelDelete}
                      className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
