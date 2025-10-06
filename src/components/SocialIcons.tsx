import { useEffect, useState, type ReactElement } from "react";
import { PLATFORMS, LABELS, type PlatformKey } from "./socials.config";

type Props = {
  socials?: Record<string, string>;
  variant?: 'homepage' | 'footer';
  showCopyright?: boolean;
};

const icons: Record<string, ReactElement> = {
  twitter: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.51 8.574L22.5 22h-6.555l-5.12-6.023L4.8 22H1.54l8.05-9.19L1 2h6.69l4.64 5.44L18.244 2Zm-1.148 17.262h1.79L7.01 4.65H5.1l11.996 14.612Z" />
    </svg>
  ),
  patreon: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="9" r="4" />
      <rect x="15" y="3" width="3" height="18" rx="1.5" />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M5 6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9.5c0 .8-.65 1.5-1.45 1.5H16l-2 2-2-2H6.45A1.5 1.5 0 0 1 5 15.5V6Z" />
      <circle cx="10" cy="11" r="1.2" className="fill-neutral-700 dark:fill-neutral-300" />
      <circle cx="14" cy="11" r="1.2" className="fill-neutral-700 dark:fill-neutral-300" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5Zm5.75-3a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.563 9.875v-6.984H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.463h-1.26c-1.242 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.984A10.002 10.002 0 0 0 22 12Z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M23.499 6.203a3.004 3.004 0 0 0-2.115-2.127C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.384.576A3.004 3.004 0 0 0 .5 6.203 31.21 31.21 0 0 0 0 12a31.21 31.21 0 0 0 .5 5.797 3.004 3.004 0 0 0 2.115 2.127C4.4 20.5 12 20.5 12 20.5s7.6 0 9.384-.576a3.004 3.004 0 0 0 2.115-2.127A31.21 31.21 0 0 0 24 12a31.21 31.21 0 0 0-.501-5.797ZM9.75 15.568V8.432L15.818 12 9.75 15.568Z" />
    </svg>
  ),
  vimeo: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 003.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3a5.5 5.5 0 0 0 .283 1.752 5.5 5.5 0 0 0 3.465 3.465A8.5 8.5 0 0 1 21 9.5 8.5 8.5 0 0 1 12.5 1h1.5v6.588a4.5 4.5 0 1 1-3.5 8.76V13.87a2 2 0 1 0 1.5-1.932V1H16.5Z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.468c.526.097.72-.228.72-.508 0-.25-.01-1.082-.015-1.963-2.933.637-3.552-1.257-3.552-1.257-.48-1.22-1.172-1.545-1.172-1.545-.957-.654.073-.64.073-.64 1.06.075 1.619 1.088 1.619 1.088.94 1.611 2.466 1.145 3.067.875.095-.681.367-1.145.668-1.409-2.342-.266-4.804-1.171-4.804-5.209 0-1.151.41-2.093 1.082-2.832-.108-.267-.469-1.344.102-2.802 0 0 .883-.283 2.894 1.081A10.07 10.07 0 0 1 12 6.844a10.06 10.06 0 0 1 2.636.355c2.01-1.364 2.892-1.08 2.892-1.08.573 1.457.212 2.535.104 2.802.673.74 1.08 1.682 1.08 2.833 0 4.05-2.466 4.94-4.813 5.202.377.326.714.968.714 1.95 0 1.409-.013 2.546-.013 2.894 0 .282.19.61.727.506A10.503 10.503 0 0 0 12 1.5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm6.93 6h-3.243a15.93 15.93 0 0 0-1.23-3.154A8.03 8.03 0 0 1 18.93 8ZM12 4c.735 0 1.99 1.62 2.657 4H9.343C10.01 5.62 11.265 4 12 4ZM8.543 4.846A15.93 15.93 0 0 0 7.313 8H4.07a8.03 8.03 0 0 1 4.473-3.154ZM4.07 16h3.244c.294 1.112.708 2.178 1.23 3.154A8.03 8.03 0 0 1 4.07 16Zm5.274 0h5.313c-.667 2.38-1.922 4-2.657 4-.735 0-1.99-1.62-2.656-4Zm6.113 3.154A15.928 15.928 0 0 0 18.93 16h-3.244c-.294 1.112-.708 2.178-1.23 3.154Z" />
    </svg>
  ),
};

export default function SocialIcons({ socials, variant = 'homepage', showCopyright = true }: Props) {
  const [fetched, setFetched] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    // If parent provided socials, do nothing. Otherwise fetch from API.
    if (socials && Object.keys(socials).length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/socials/get.php', { credentials: 'same-origin', cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const s = data && (data.socials || (data.success ? data.socials : null));
          if (!cancelled && s && typeof s === 'object') {
            setFetched(s);
          }
        }
      } catch {
        // ignore fetch errors
      }
    })();
    return () => { cancelled = true; };
  }, [socials]);

  const s = socials ?? fetched;
  if (!s || Object.keys(s).length === 0) return null;

  const ordered: PlatformKey[] = PLATFORMS;

  if (variant === 'footer') {
    // Footer variant (for galleries) with copyright
    return (
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-4 py-6">
          {ordered.map((key) => {
            const url = s[key];
            if (!url) return null;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={LABELS[key] || key}
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 p-2 hover:border-neutral-400 transition shadow-sm
                           dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600"
              >
                {icons[key] || <span className="text-sm">{key}</span>}
              </a>
            );
          })}
        </div>
        {showCopyright && (
          <div className="pb-10 text-center text-xs opacity-70">
            &copy; {new Date().getFullYear()} All Rights Reserved.
          </div>
        )}
      </div>
    );
  }

  // Default variant (for homepage and storytime)
  return (
    <div className="flex items-center justify-center gap-3">
      {ordered.map((key) => {
        const url = s[key];
        if (!url) return null;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={LABELS[key] || key}
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 p-2 hover:border-neutral-400 transition shadow-sm
                       dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600"
          >
            {icons[key] || <span className="text-sm">{key}</span>}
          </a>
        );
      })}
    </div>
  );
}
