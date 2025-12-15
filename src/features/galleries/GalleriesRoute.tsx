import { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import type { ImageMeta, Rating, Socials, CollectionCardItem } from "./types";
import { ImageCard } from "./components/ImageCard";
import { API_BASE } from "../../lib/apiBase";
import PageNavbar from "../../components/PageNavbar";
import SocialIcons from "../../components/SocialIcons";
import NewsletterCTA from "../../components/NewsletterCTA";
import { ApiGalleryCards, type ApiGalleryCardItem } from "./components/ApiGalleryCards";
import { analytics } from "../../lib/analytics";
import { useAuth } from "../../contexts/AuthContext";

const PAGE_SIZE = 20;

function CollectionsList() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [socials, setSocials] = useState<Socials | undefined>(undefined);
  const [collections, setCollections] = useState<CollectionCardItem[] | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);

  const openCollection = (slug: string) => {
    navigate(`/galleries/collection/${encodeURIComponent(slug)}`);
  };

  // Initial load: socials + collections + author profile
  useEffect(() => {
    async function loadBoot() {
      try {
        const [authorRes, socialsRes, colRes] = await Promise.allSettled([
          fetch(`${API_BASE}/author/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/socials/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/collections/list.php?status=published&limit=1000`, { cache: "no-cache" })
        ]);

        if (authorRes.status === 'fulfilled' && authorRes.value.ok) {
          const authorData = await authorRes.value.json();
          if (authorData.success) setAuthorProfile(authorData.profile);
        }
        if (socialsRes.status === 'fulfilled' && socialsRes.value.ok) {
          const socialsData = await socialsRes.value.json();
          setSocials(socialsData.socials || {});
        }
        if (colRes.status === 'fulfilled' && colRes.value.ok) {
          const cj = await colRes.value.json();
          const items: CollectionCardItem[] = (cj.collections || []).map((c: any) => ({
            id: Number(c.id),
            slug: String(c.slug),
            title: String(c.title || 'Untitled'),
            description: c.description || undefined,
            themes: Array.isArray(c.themes) ? c.themes : [],
            status: (c.status === 'draft' || c.status === 'archived') ? c.status : 'published',
            cover_hero: c.cover_hero || null,
            sort_order: typeof c.sort_order === 'number' ? c.sort_order : 0,
            gallery_count: Number(c.gallery_count || 0)
          }));
          setCollections(items);
          setError(null);
        } else {
          throw new Error("Failed to fetch collections list");
        }
      } catch (e: any) {
        console.error(e);
        setError("Unable to load collections. Ensure the new PHP API is uploaded and database configured.");
      }
    }
    loadBoot();
  }, []);

  // SEO meta for collections landing
  const authorName = authorProfile?.name || 'Author Name';
  const baseDomain = authorProfile?.site_domain || 'example.com';
  const url = `https://${baseDomain}/galleries`;
  const description = `Browse ${authorName}'s gallery collections (projects). Drill into each collection to view its galleries.`;
  const title = `Gallery Collections | ${authorName} | ${authorProfile?.bio || 'Author & Artist'}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-200">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="Gallery Collections" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content={authorName} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Gallery Collections" />
        <meta name="twitter:description" content={description} />
        <meta name="author" content={authorName} />
      </Helmet>
      <PageNavbar breadcrumbs={[{ label: 'Galleries' }]} />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Collections
          </h1>
        </div>

        <main>
          {error && !collections ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : !collections ? (
            <p>Loading…</p>
          ) : collections.length === 0 ? (
            <p className="opacity-70">No collections yet.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => openCollection(c.slug)}
                    className="w-full text-left rounded-xl border bg-white/70 dark:bg-black/70 border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30 hover:bg-white/80 dark:hover:bg-black/80 shadow transition-all"
                  >
                    {c.cover_hero && (
                      <div className="w-full aspect-[16/9] overflow-hidden rounded-t-xl bg-neutral-200 dark:bg-neutral-800">
                        <img
                          src={c.cover_hero}
                          alt={`${c.title} cover`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {c.title}
                        </h3>
                        <span className="text-xs text-gray-600 dark:text-neutral-300 whitespace-nowrap">
                          {c.gallery_count} {c.gallery_count === 1 ? 'gallery' : 'galleries'}
                        </span>
                      </div>
                      {c.description && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-neutral-300 line-clamp-3">
                          {c.description}
                        </p>
                      )}
                      {Array.isArray(c.themes) && c.themes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {c.themes.slice(0, 4).map((t, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-neutral-200"
                            >
                              {t}
                            </span>
                          ))}
                          {c.themes.length > 4 && (
                            <span className="text-xs text-gray-600 dark:text-neutral-300">
                              +{c.themes.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>

        {socials && <SocialIcons socials={socials} variant="footer" />}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3">
            Get notified when new collections drop
          </p>
          <NewsletterCTA variant="button" source="gallery_collections" />
        </div>
      </div>
    </div>
  );
}

function CollectionGalleries() {
  const { cslug } = useParams<{ cslug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Initialize rating from localStorage or default to PG
  const [rating, setRating] = useState<Rating>(() => {
    const saved = localStorage.getItem('gallery_rating_filter');
    return (saved === 'X' ? 'X' : 'PG') as Rating;
  });
  const [error, setError] = useState<string | null>(null);
  const [socials, setSocials] = useState<Socials | undefined>(undefined);
  const [galleries, setGalleries] = useState<ApiGalleryCardItem[] | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [collection, setCollection] = useState<CollectionCardItem | null>(null);

  const openGallery = (slug: string) => {
    navigate(`/galleries/${encodeURIComponent(slug)}`);
  };

  // Initial load
  useEffect(() => {
    async function loadBoot() {
      try {
        // Include unpublished galleries when user is authenticated
        const includeUnpublished = user ? '&include_unpublished=1' : '';
        const [authorRes, socialsRes, colRes, galRes] = await Promise.allSettled([
          fetch(`${API_BASE}/author/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/socials/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/collections/list.php?slug=${encodeURIComponent(cslug || '')}`, { cache: "no-cache" }),
          fetch(`${API_BASE}/galleries/list.php?collection_slug=${encodeURIComponent(cslug || '')}&limit=1000${includeUnpublished}`, { cache: "no-cache" }),
        ]);

        if (authorRes.status === 'fulfilled' && authorRes.value.ok) {
          const authorData = await authorRes.value.json();
          if (authorData.success) setAuthorProfile(authorData.profile);
        }
        if (socialsRes.status === 'fulfilled' && socialsRes.value.ok) {
          const socialsData = await socialsRes.value.json();
          setSocials(socialsData.socials || {});
        }
        if (colRes.status === 'fulfilled' && colRes.value.ok) {
          const cj = await colRes.value.json();
          const first = Array.isArray(cj.collections) && cj.collections.length > 0 ? cj.collections[0] : null;
          if (first) {
            setCollection({
              id: Number(first.id),
              slug: String(first.slug),
              title: String(first.title || 'Untitled'),
              description: first.description || undefined,
              themes: Array.isArray(first.themes) ? first.themes : [],
              status: (first.status === 'draft' || first.status === 'archived') ? first.status : 'published',
              cover_hero: first.cover_hero || null,
              sort_order: typeof first.sort_order === 'number' ? first.sort_order : 0,
              gallery_count: Number(first.gallery_count || 0)
            });
          }
        }
        if (galRes.status === 'fulfilled' && galRes.value.ok) {
          const gj = await galRes.value.json();
          const items: ApiGalleryCardItem[] = (gj.galleries || []).map((g: any) => ({
            id: Number(g.id) || 0,
            slug: String(g.slug || ''),
            title: String(g.title || 'Untitled'),
            description: g.description ? String(g.description) : undefined,
            rating: (g.rating === "X" ? "X" : "PG") as "PG" | "X",
            image_count: Number(g.image_count) || 0,
            like_count: Number(g.like_count) || 0,
            comment_count: Number(g.comment_count) || 0,
            hero_thumb: g.hero_thumb ? String(g.hero_thumb) : null,
            hero_width: g.hero_width ? Number(g.hero_width) : null,
            hero_height: g.hero_height ? Number(g.hero_height) : null,
          }));
          setGalleries(items);
        } else {
          setGalleries([]);
        }
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError("Unable to load collection.");
      }
    }
    if (cslug) loadBoot();
  }, [cslug, user]);

  const visibleGalleries = useMemo(() => {
    if (!galleries) return [];
    if (rating === "PG") return galleries.filter((g) => (g.rating ?? "PG") === "PG");
    return galleries;
  }, [galleries, rating]);

  // Only show rating filter when configured or when X-rated galleries exist (auto)
  const shouldShowRatingFilter = useMemo(() => {
    const filterSetting = authorProfile?.gallery_rating_filter || 'auto';
    if (filterSetting === 'always') return true;
    if (filterSetting === 'never') return false;
    return galleries?.some((g) => g.rating === 'X') ?? false;
  }, [authorProfile?.gallery_rating_filter, galleries]);

  const authorName = authorProfile?.name || 'Author Name';
  const baseDomain = authorProfile?.site_domain || 'example.com';
  const galleriesUrl = `https://${baseDomain}/galleries/collection/${cslug}`;
  const galleriesDescription = collection?.description || `Explore galleries inside the ${collection?.title || 'collection'} project by ${authorName}.`;
  const galleriesTitle = `${collection?.title || 'Collection'} | ${authorName} | ${authorProfile?.bio || 'Author & Artist'}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-200">
      <Helmet>
        <title>{galleriesTitle}</title>
        <meta name="description" content={galleriesDescription} />
        <link rel="canonical" href={galleriesUrl} />
        <meta property="og:title" content={collection?.title || 'Collection'} />
        <meta property="og:description" content={galleriesDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={galleriesUrl} />
        <meta property="og:site_name" content={authorName} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={collection?.title || 'Collection'} />
        <meta name="twitter:description" content={galleriesDescription} />
      </Helmet>
      <PageNavbar breadcrumbs={[
        { label: 'Galleries', path: '/galleries' },
        { label: collection?.title || cslug || 'Collection' }
      ]} />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {collection?.title || "Collection"}
          </h1>
          
          {shouldShowRatingFilter && (
            <div className="flex items-center gap-2">
              <select
                aria-label="Rating filter"
                value={rating}
                onChange={(e) => {
                  const newRating = e.target.value as Rating;
                  setRating(newRating);
                  localStorage.setItem('gallery_rating_filter', newRating);
                }}
                className="rounded-lg border border-gray-300 bg-white text-gray-900 hover:border-gray-400 dark:border-white/30 dark:bg-black/70 dark:text-white dark:hover:border-white/50 px-3 py-2 text-sm transition-colors"
              >
                <option value="PG">PG</option>
                <option value="X">X</option>
              </select>
            </div>
          )}
        </div>

        {collection?.description && (
          <p className="mb-6 opacity-80">{collection.description}</p>
        )}

        <main>
          {error && !galleries ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : galleries ? (
            <ApiGalleryCards
              items={visibleGalleries}
              onOpen={openGallery}
              showAdultBadge={rating === "X"}
            />
          ) : (
            <p>Loading…</p>
          )}
        </main>

        {socials && <SocialIcons socials={socials} variant="footer" />}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3">
            Get notified when I publish new galleries
          </p>
          <NewsletterCTA variant="button" source="collection_galleries" />
        </div>
      </div>
    </div>
  );
}

function GalleryList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Initialize rating from localStorage or default to PG
  const [rating, setRating] = useState<Rating>(() => {
    const saved = localStorage.getItem('gallery_rating_filter');
    return (saved === 'X' ? 'X' : 'PG') as Rating;
  });
  const [error, setError] = useState<string | null>(null);
  const [socials, setSocials] = useState<Socials | undefined>(undefined);
  const [galleries, setGalleries] = useState<ApiGalleryCardItem[] | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);

  const openGallery = (slug: string) => {
    navigate(`/galleries/${encodeURIComponent(slug)}`);
  };

  // Initial load: socials + galleries + author profile
  useEffect(() => {
    async function loadBoot() {
      try {
        // Include unpublished galleries when user is authenticated
        const includeUnpublished = user ? '&include_unpublished=1' : '';
        // Load author profile, socials, and galleries in parallel
        const [authorRes, socialsRes, galleriesRes] = await Promise.allSettled([
          fetch(`${API_BASE}/author/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/socials/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/galleries/list.php?page=1&limit=1000${includeUnpublished}`, { cache: "no-cache" })
        ]);

        // Handle author profile
        if (authorRes.status === 'fulfilled' && authorRes.value.ok) {
          const authorData = await authorRes.value.json();
          if (authorData.success) {
            setAuthorProfile(authorData.profile);
          }
        }

        // Handle socials
        if (socialsRes.status === 'fulfilled' && socialsRes.value.ok) {
          const socialsData = await socialsRes.value.json();
          setSocials(socialsData.socials || {});
        }

        // Handle galleries
        if (galleriesRes.status === 'fulfilled' && galleriesRes.value.ok) {
          const galleriesData = await galleriesRes.value.json();
          const items = (galleriesData.galleries || []).map((g: any) => ({
            id: Number(g.id) || 0,
            slug: String(g.slug || ''),
            title: String(g.title || 'Untitled'),
            description: g.description ? String(g.description) : undefined,
            rating: (g.rating === "X" ? "X" : "PG") as "PG" | "X",
            image_count: Number(g.image_count) || 0,
            like_count: Number(g.like_count) || 0,
            comment_count: Number(g.comment_count) || 0,
            hero_thumb: g.hero_thumb ? String(g.hero_thumb) : null,
            hero_width: g.hero_width ? Number(g.hero_width) : null,
            hero_height: g.hero_height ? Number(g.hero_height) : null,
          })) as ApiGalleryCardItem[];
          setGalleries(items);
          setError(null);
        } else {
          throw new Error("Failed to fetch galleries list");
        }
      } catch (e: any) {
        console.error(e);
        setError("Unable to load galleries. Ensure the new PHP API is uploaded and database configured.");
      }
    }
    loadBoot();
  }, [user]);

  const visibleGalleries = useMemo(() => {
    if (!galleries) return [];
    if (rating === "PG") return galleries.filter((g) => (g.rating ?? "PG") === "PG");
    return galleries;
  }, [galleries, rating]);

  // Determine if rating filter should be shown
  const shouldShowRatingFilter = useMemo(() => {
    const filterSetting = authorProfile?.gallery_rating_filter || 'auto';
    
    if (filterSetting === 'always') return true;
    if (filterSetting === 'never') return false;
    
    // 'auto' mode: show only if X-rated galleries exist
    return galleries?.some((g) => g.rating === 'X') ?? false;
  }, [authorProfile?.gallery_rating_filter, galleries]);

  // SEO meta data for gallery listing page
  const authorName = authorProfile?.name || 'Author Name';
  const baseDomain = authorProfile?.site_domain || 'example.com';
  const galleriesUrl = `https://${baseDomain}/galleries/all`;
  const galleriesDescription = `Browse all galleries by ${authorName}.`;
  const galleriesTitle = `All Galleries | ${authorName} | ${authorProfile?.bio || 'Author & Artist'}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-200">
      <Helmet>
        <title>{galleriesTitle}</title>
        <meta name="description" content={galleriesDescription} />
        <link rel="canonical" href={galleriesUrl} />
        <meta property="og:title" content="All Galleries" />
        <meta property="og:description" content={galleriesDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={galleriesUrl} />
        <meta property="og:site_name" content={authorName} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="All Galleries" />
        <meta name="twitter:description" content={galleriesDescription} />
        <meta name="author" content={authorName} />
      </Helmet>
      <PageNavbar breadcrumbs={[
        { label: 'Galleries', path: '/galleries' },
        { label: 'All' }
      ]} />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Header with controls */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            All Galleries
          </h1>
          
          {shouldShowRatingFilter && (
            <div className="flex items-center gap-2">
              <select
                aria-label="Rating filter"
                value={rating}
                onChange={(e) => {
                  const newRating = e.target.value as Rating;
                  setRating(newRating);
                  localStorage.setItem('gallery_rating_filter', newRating);
                }}
                className="rounded-lg border border-gray-300 bg-white text-gray-900 hover:border-gray-400 dark:border-white/30 dark:bg-black/70 dark:text-white dark:hover:border-white/50 px-3 py-2 text-sm transition-colors"
              >
                <option value="PG">PG</option>
                <option value="X">X</option>
              </select>
            </div>
          )}
        </div>

        <main>
          {error && !galleries ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : galleries ? (
            <ApiGalleryCards
              items={visibleGalleries}
              onOpen={openGallery}
              showAdultBadge={rating === "X"}
            />
          ) : (
            <p>Loading…</p>
          )}
        </main>

        {socials && <SocialIcons socials={socials} variant="footer" />}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3">
            Get notified when I publish new galleries
          </p>
          <NewsletterCTA variant="button" source="gallery_list" />
        </div>
      </div>
    </div>
  );
}

function GalleryView() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  // Initialize rating from localStorage or default to PG
  const [rating, setRating] = useState<Rating>(() => {
    const saved = localStorage.getItem('gallery_rating_filter');
    return (saved === 'X' ? 'X' : 'PG') as Rating;
  });
  const [error, setError] = useState<string | null>(null);
  const [socials, setSocials] = useState<Socials | undefined>(undefined);
  const [galleries, setGalleries] = useState<ApiGalleryCardItem[] | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [imgPage, setImgPage] = useState(1);
  const [imgTotal, setImgTotal] = useState(0);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgHasMore, setImgHasMore] = useState(false);
  const fetchingRef = useRef(false);

  // Map slug -> id for quick lookup
  const slugToId = useMemo(() => {
    const m = new Map<string, number>();
    (galleries || []).forEach((g) => m.set(g.slug, g.id));
    return m;
  }, [galleries]);

  // Current gallery info
  const currentGallery = useMemo<ApiGalleryCardItem | null>(() => {
    if (!galleries || !slug) return null;
    return (galleries.find((g) => g.slug === slug) as ApiGalleryCardItem | undefined) || null;
  }, [galleries, slug]);

  // Track gallery view
  useEffect(() => {
    if (currentGallery && currentGallery.id) {
      analytics.trackGalleryView(currentGallery.id);
    }
  }, [currentGallery]);

  // Initial load: socials + galleries + author profile
  useEffect(() => {
    async function loadBoot() {
      try {
        // Include unpublished galleries when user is authenticated
        const includeUnpublished = user ? '&include_unpublished=1' : '';
        // Load author profile, socials, and galleries in parallel
        const [authorRes, socialsRes, galleriesRes] = await Promise.allSettled([
          fetch(`${API_BASE}/author/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/socials/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/galleries/list.php?page=1&limit=1000${includeUnpublished}`, { cache: "no-cache" })
        ]);

        // Handle author profile
        if (authorRes.status === 'fulfilled' && authorRes.value.ok) {
          const authorData = await authorRes.value.json();
          if (authorData.success) {
            setAuthorProfile(authorData.profile);
          }
        }

        // Handle socials
        if (socialsRes.status === 'fulfilled' && socialsRes.value.ok) {
          const socialsData = await socialsRes.value.json();
          setSocials(socialsData.socials || {});
        }

        // Handle galleries
        if (galleriesRes.status === 'fulfilled' && galleriesRes.value.ok) {
          const galleriesData = await galleriesRes.value.json();
          const items = (galleriesData.galleries || []).map((g: any) => ({
            id: Number(g.id) || 0,
            slug: String(g.slug || ''),
            title: String(g.title || 'Untitled'),
            description: g.description ? String(g.description) : undefined,
            rating: (g.rating === "X" ? "X" : "PG") as "PG" | "X",
            image_count: Number(g.image_count) || 0,
            like_count: Number(g.like_count) || 0,
            comment_count: Number(g.comment_count) || 0,
            hero_thumb: g.hero_thumb ? String(g.hero_thumb) : null,
            hero_width: g.hero_width ? Number(g.hero_width) : null,
            hero_height: g.hero_height ? Number(g.hero_height) : null,
          })) as ApiGalleryCardItem[];
          setGalleries(items);
          setError(null);
        } else {
          throw new Error("Failed to fetch galleries list");
        }
      } catch (e: any) {
        console.error(e);
        setError("Unable to load galleries. Ensure the new PHP API is uploaded and database configured.");
      }
    }
    loadBoot();
  }, [user]);

  // When switching gallery or search, reset images and load from page 1
  useEffect(() => {
    setImages([]);
    setImgPage(1);
    setImgTotal(0);
    setImgHasMore(false);
  }, [slug, q]);

  // Load one page of images for current gallery
  useEffect(() => {
    async function loadImages() {
      if (!slug) return;
      const gid = slugToId.get(slug);
      if (!gid) return;

      // Prevent duplicate concurrent loads
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setImgLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("gallery_id", String(gid));
        params.set("page", String(imgPage));
        params.set("limit", String(PAGE_SIZE));
        const qq = q.trim();
        if (qq) params.set("q", qq);

        const ri = await fetch(`${API_BASE}/images/gallery-list.php?` + params.toString(), { cache: "no-cache" });
        if (!ri.ok) throw new Error("Failed to fetch images");
        const ij = await ri.json();
        const total: number = ij.total ?? 0;
        const arr = (ij.images || []) as any[];

        const mapped: ImageMeta[] = arr.map((im) => ({
          id: typeof im.id === "number" ? im.id : undefined,
          src: im.src,
          thumb: im.thumb,
          title: im.title ?? undefined,
          prompt: im.prompt ?? undefined,
          parameters: im.parameters ?? undefined,
          checkpoint: im.checkpoint ?? null,
          loras: Array.isArray(im.loras) ? im.loras : [],
          width: typeof im.width === "number" ? im.width : undefined,
          height: typeof im.height === "number" ? im.height : undefined,
          // Include media info so the modal can render <video> correctly
          media_type: im.media_type ?? "image",
          mime_type: im.mime_type ?? null,
          poster: im.poster ?? null,
        }));

        setImages(prev => {
          const next = [...prev, ...mapped];
          setImgHasMore(next.length < total);
          return next;
        });
        setImgTotal(total);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load images for this gallery.");
      } finally {
        setImgLoading(false);
        fetchingRef.current = false;
      }
    }
    if (slug) loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, imgPage, q, galleries]);

  const loadMoreImages = () => {
    if (imgLoading) return;
    if (!imgHasMore) return;
    setImgPage((p) => p + 1);
  };

  // Determine if rating filter should be shown
  const shouldShowRatingFilter = useMemo(() => {
    const filterSetting = authorProfile?.gallery_rating_filter || 'auto';
    
    if (filterSetting === 'always') return true;
    if (filterSetting === 'never') return false;
    
    // 'auto' mode: show only if X-rated galleries exist
    return galleries?.some((g) => g.rating === 'X') ?? false;
  }, [authorProfile?.gallery_rating_filter, galleries]);

  // SEO meta data for individual gallery page
  const authorName = authorProfile?.name || 'Author Name';
  const baseDomain = authorProfile?.site_domain || 'example.com';
  const galleryUrl = `https://${baseDomain}/galleries/${slug}`;
  const galleryTitle = currentGallery?.title || 'Gallery';
  const galleryDescription = currentGallery?.description 
    ? `${currentGallery.description} - Artwork by ${authorName}.`
    : `View ${galleryTitle} image gallery featuring artwork by ${authorName}. Creative visual storytelling and artistic designs.`;
  const pageTitle = `${galleryTitle} | ${authorName} | ${authorProfile?.bio || 'Author & Artist'}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-200">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={galleryDescription} />
        <link rel="canonical" href={galleryUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={galleryTitle} />
        <meta property="og:description" content={galleryDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={galleryUrl} />
        <meta property="og:site_name" content={authorName} />
        {currentGallery?.hero_thumb && (
          <meta property="og:image" content={currentGallery.hero_thumb.startsWith('http') ? currentGallery.hero_thumb : `https://${baseDomain}${currentGallery.hero_thumb}`} />
        )}
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={galleryTitle} />
        <meta name="twitter:description" content={galleryDescription} />
        <meta name="twitter:creator" content="" />
        {currentGallery?.hero_thumb && (
          <meta name="twitter:image" content={currentGallery.hero_thumb.startsWith('http') ? currentGallery.hero_thumb : `https://${baseDomain}${currentGallery.hero_thumb}`} />
        )}
        
        {/* Additional SEO */}
        <meta name="author" content={authorName} />
        <meta name="keywords" content="digital artwork, concept art, character design, illustration, visual art, creative design" />
      </Helmet>
      <PageNavbar breadcrumbs={[
        { label: 'Galleries', path: '/galleries' },
        { label: currentGallery?.title || slug || 'Gallery' }
      ]} />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Header with controls */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {currentGallery?.title || "Gallery"}
          </h1>
          
          <div className="flex items-center gap-2">
            {shouldShowRatingFilter && (
              <select
                aria-label="Rating filter"
                value={rating}
                onChange={(e) => setRating(e.target.value as Rating)}
                className="rounded-lg border border-gray-300 bg-white text-gray-900 hover:border-gray-400 dark:border-white/30 dark:bg-black/70 dark:text-white dark:hover:border-white/50 px-3 py-2 text-sm transition-colors"
              >
                <option value="PG">PG</option>
                <option value="X">X</option>
              </select>
            )}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search prompt / LoRA / checkpoint…"
              className="w-full max-w-md rounded-xl bg-white text-gray-900 placeholder:text-gray-500 ring-gray-300 focus:ring-gray-500 dark:bg-black/70 dark:text-white dark:placeholder:text-neutral-400 dark:ring-white/30 dark:focus:ring-white/50 px-3 py-2 text-sm outline-none ring-1 transition-colors"
            />
          </div>
        </div>

        <main>
          {error ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : currentGallery ? (
            <section>
              {currentGallery.description && (
                <p className="mb-4 opacity-80">{currentGallery.description}</p>
              )}

              {/* Images grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((im) => (
                  <ImageCard key={String(im.id ?? im.src)} im={im} galleryId={currentGallery?.id} />
                ))}
              </div>

              {/* Pagination controls */}
              <div className="mt-6 flex items-center justify-center">
                {imgLoading && images.length === 0 ? (
                  <p>Loading…</p>
                ) : imgHasMore ? (
                  <button
                    onClick={loadMoreImages}
                    disabled={imgLoading}
                    className="rounded-lg border border-gray-300 bg-white text-gray-900 hover:border-gray-400 dark:border-white/30 dark:bg-black/70 dark:text-white dark:hover:border-white/50 px-3 py-1 text-sm transition-colors disabled:opacity-60"
                  >
                    {imgLoading ? "Loading…" : "Load more"}
                  </button>
                ) : images.length >= imgTotal ? (
                  <p className="opacity-70 text-sm">No more images.</p>
                ) : null}
              </div>
            </section>
          ) : (
            <p className="opacity-70">Gallery not found.</p>
          )}
        </main>

        {socials && <SocialIcons socials={socials} variant="footer" />}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3">
            Get notified about new gallery uploads
          </p>
          <NewsletterCTA variant="button" source="gallery_detail" />
        </div>
      </div>
    </div>
  );
}

export default function GalleriesRoute() {
  return (
    <Routes>
      <Route path="/" element={<CollectionsList />} />
      <Route path="/collection/:cslug" element={<CollectionGalleries />} />
      <Route path="/all" element={<GalleryList />} />
      <Route path="/:slug" element={<GalleryView />} />
    </Routes>
  );
}
