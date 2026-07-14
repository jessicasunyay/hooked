import { useState } from "react";
import type { PatternCard } from "@/src/types";
import { useCardImage, FALLBACK_IMAGE } from "@/src/lib/image";
import { StatusBadge } from "./StatusBadge";
import { TagPill } from "./TagPill";

interface CardProps {
  card: PatternCard;
  // clicking a card opens the detail view in the side panel
  onClick?: () => void;
}

// pulls the hostname out of a URL for display under the title
function sourceHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function Card({ card, onClick }: CardProps) {
  const imgSrc = useCardImage(card.url);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-slate-300 hover:shadow-sm transition"
    >
      <img
        src={imgFailed ? FALLBACK_IMAGE : imgSrc}
        alt={card.title}
        onError={() => setImgFailed(true)}
        className="h-14 w-14 shrink-0 rounded-md object-contain bg-slate-50"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-slate-900">
          {card.title}
        </h3>
        <p className="truncate text-xs text-slate-400">
          {sourceHostname(card.url)}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <StatusBadge status={card.status} />
        </div>

        {card.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {card.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export default Card;
