import { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import type { ImageMeta, Rating, Socials } from "./types";
import { ImageCard } from "./components/ImageCard";
import { API_BASE } from "../../lib/apiBase";
import ThemeToggle from "../../components/ThemeToggle";
import SocialIcons from "../../components/SocialIcons";
import { ApiGalleryCards, type ApiGalleryCardItem } from "./components/ApiGalleryCards";

const PAGE_SIZE = 20;

function GalleryList() {
  const navigate = useNavigate();
  const [rating, setRating] = useState<Rating>("PG");
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
        // Load author profile, socials, and galleries in parallel
        const [authorRes, socialsRes, galleriesRes] = await Promise.allSettled([
          fetch(`${API_BASE}/author/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/socials/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/galleries/list.php?page=1&limit=1000`, { cache: "no-cache" })
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
  }, []);

  const visibleGalleries = useMemo(() => {
    if (!galleries) return [];
    if (rating === "PG") return galleries.filter((g) => (g.rating ?? "PG") === "PG");
    return galleries;
  }, [galleries, rating]);

  // SEO meta data for gallery listing page
  const authorName = authorProfile?.name || 'Author Name';
  const baseDomain = authorProfile?.site_domain || 'example.com';
  const galleriesUrl = `https://${baseDomain}/galleries`;
  const galleriesDescription = `Browse ${authorName}'s collection of artwork and illustrations. Featuring creative visual storytelling and artistic designs.`;
  const galleriesTitle = `Image Galleries | ${authorName} | ${authorProfile?.bio || 'Author & Artist'}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-200">
      <Helmet>
        <title>{galleriesTitle}</title>
        <meta name="description" content={galleriesDescription} />
        <link rel="canonical" href={galleriesUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Image Galleries" />
        <meta property="og:description" content={galleriesDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={galleriesUrl} />
        <meta property="og:site_name" content={authorName} />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Image Galleries" />
        <meta name="twitter:description" content={galleriesDescription} />
        <meta name="twitter:creator" content="" />
        
        {/* Additional SEO */}
        <meta name="author" content={authorName} />
        <meta name="keywords" content="digital artwork, concept art, character design, illustration gallery, visual art, creative design" />
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            "name": "Image Galleries",
            "description": galleriesDescription,
            "author": {
              "@type": "Person",
              "name": authorName
            },
            "url": galleriesUrl,
            "inLanguage": "en-US"
          })}
        </script>
      </Helmet>
      <ThemeToggle />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <div className="bg-white/70 border-gray-300 dark:bg-black/70 dark:border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
              <Link to="/" className="hover:underline hover:text-gray-900 dark:hover:text-neutral-200">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Galleries</span>
            </div>
          </div>
        </div>

        {/* Header with controls */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            All Galleries
          </h1>
          
          <div className="flex items-center gap-2">
            <select
              aria-label="Rating filter"
              value={rating}
              onChange={(e) => setRating(e.target.value as Rating)}
              className="rounded-lg border border-gray-300 bg-white text-gray-900 hover:border-gray-400 dark:border-white/30 dark:bg-black/70 dark:text-white dark:hover:border-white/50 px-3 py-2 text-sm transition-colors"
            >
              <option value="PG">PG</option>
              <option value="X">X</option>
            </select>
          </div>
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
      </div>
    </div>
  );
}

function GalleryView() {
  const { slug } = useParams<{ slug: string }>();
  const [q, setQ] = useState("");
  const [rating, setRating] = useState<Rating>("PG");
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

  // Initial load: socials + galleries + author profile
  useEffect(() => {
    async function loadBoot() {
      try {
        // Load author profile, socials, and galleries in parallel
        const [authorRes, socialsRes, galleriesRes] = await Promise.allSettled([
          fetch(`${API_BASE}/author/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/socials/get.php`, { cache: "no-cache" }),
          fetch(`${API_BASE}/galleries/list.php?page=1&limit=1000`, { cache: "no-cache" })
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
  }, []);

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
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            "name": galleryTitle,
            "description": galleryDescription,
            "author": {
              "@type": "Person",
              "name": authorName
            },
            "url": galleryUrl,
            "inLanguage": "en-US",
            ...(currentGallery?.hero_thumb && {
              "image": currentGallery.hero_thumb.startsWith('http') ? currentGallery.hero_thumb : `https://${baseDomain}${currentGallery.hero_thumb}`
            })
          })}
        </script>
      </Helmet>
      <ThemeToggle />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <div className="bg-white/70 border-gray-300 dark:bg-black/70 dark:border-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
              <Link to="/" className="hover:underline hover:text-gray-900 dark:hover:text-neutral-200">
                Home
              </Link>
              <span>/</span>
              <Link to="/galleries" className="hover:underline hover:text-gray-900 dark:hover:text-neutral-200">
                Galleries
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">{currentGallery?.title || slug}</span>
            </div>
          </div>
        </div>

        {/* Header with controls */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {currentGallery?.title || "Gallery"}
          </h1>
          
          <div className="flex items-center gap-2">
            <select
              aria-label="Rating filter"
              value={rating}
              onChange={(e) => setRating(e.target.value as Rating)}
              className="rounded-lg border border-gray-300 bg-white text-gray-900 hover:border-gray-400 dark:border-white/30 dark:bg-black/70 dark:text-white dark:hover:border-white/50 px-3 py-2 text-sm transition-colors"
            >
              <option value="PG">PG</option>
              <option value="X">X</option>
            </select>
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
                  <ImageCard key={String(im.id ?? im.src)} im={im} />
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
      </div>
    </div>
  );
}

export default function GalleriesRoute() {
  return (
    <Routes>
      <Route path="/" element={<GalleryList />} />
      <Route path="/:slug" element={<GalleryView />} />
    </Routes>
  );
}
