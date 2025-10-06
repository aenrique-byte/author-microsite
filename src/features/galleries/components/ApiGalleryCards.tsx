import type { ApiGalleryCardItem } from "../types";

export function ApiGalleryCards({
  items,
  onOpen,
  showAdultBadge = false,
}: {
  items: ApiGalleryCardItem[];
  onOpen: (slug: string) => void;
  showAdultBadge?: boolean;
}) {
  if (!items?.length) {
    return <p className="opacity-70">No galleries found.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((g) => {
        // Defensive sanitization to prevent React errors
        const safeSlug = String(g.slug || '');
        const safeTitle = String(g.title || 'Untitled');
        const safeDescription = g.description ? String(g.description) : null;
        const safeImageCount = Number(g.image_count) || 0;
        const hero = g.hero_thumb ? String(g.hero_thumb) : null;
        const heroWidth = Number(g.hero_width) || null;
        const heroHeight = Number(g.hero_height) || null;
        const isUltra = !!(heroWidth && heroHeight && heroWidth / heroHeight >= 2.2);
        
        return (
          <button
            key={safeSlug}
            className={`group text-left rounded-2xl overflow-hidden border bg-white border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700 dark:focus:ring-neutral-600 ${isUltra ? 'sm:col-span-2 lg:col-span-3' : ''}`}
            onClick={() => onOpen(safeSlug)}
            aria-label={`Open ${safeTitle}`}
          >
            <div className={isUltra ? "relative w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 aspect-[21/9]" : "relative w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 aspect-[4/3]"}>
              {hero ? (
                <img
                  src={hero}
                  alt={safeTitle}
                  className={`h-full w-full transition-transform duration-300 group-hover:scale-[1.03] ${isUltra ? 'object-contain' : 'object-cover'}`}
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-neutral-400 text-sm">
                  No image
                </div>
              )}
              {showAdultBadge && g.rating === "X" && (
                <span
                  title="18+ content"
                  className="pointer-events-none absolute top-2 right-2 rounded-md bg-red-600/90 px-2 py-1 text-xs font-semibold text-white shadow-md"
                >
                  🔞
                </span>
              )}
            </div>
            <div className="p-3 space-y-1">
              <h3 className="font-semibold">{safeTitle}</h3>
              {safeDescription ? (
                <p className="text-sm opacity-80 line-clamp-3">{safeDescription}</p>
              ) : null}
              <div className="flex items-center gap-3 text-xs opacity-60">
                <span>📷 {safeImageCount}</span>
                <span>❤️ {Number(g.like_count) || 0}</span>
                <span>💬 {Number(g.comment_count) || 0}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export type { ApiGalleryCardItem };
