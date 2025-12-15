import React from "react";

// Universe Portal Homepage Draft
// TailwindCSS-based layout for O.C. Wanderer

const universes = [
  {
    id: "destiny",
    title: "Destiny Among the Stars",
    tag: "Sci‑Fi • LitRPG • Space Opera",
    blurb:
      "A young crew pushes humanity beyond the Solar System and straight into an ancient interstellar war.",
    cta: "Enter the Triumph of Darron",
  },
  {
    id: "sinbad",
    title: "Sinbad, Captain of the Sky",
    tag: "Sky Pirates • Adventure • Magic",
    blurb:
      "A cursed captain, drifting sky-ships, and a world of floating isles and forgotten relics.",
    cta: "Board the Skyship",
  },
  {
    id: "knight",
    title: "Knights Errant",
    tag: "Low Fantasy • Intrigue • Romance",
    blurb:
      "A disgraced knight must choose between his vows and the soul of a crumbling kingdom.",
    cta: "Ride into the Borderlands",
  },
  {
    id: "warlock",
    title: "The Warlock of Meredith",
    tag: "Dark Fantasy • Guild Politics",
    blurb:
      "A young warlock bound to a demon navigates corrupt guilds and impossible bargains.",
    cta: "Step into the Circle",
  },
];

const activity = [
  {
    source: "RoyalRoad",
    label: "New Chapter",
    title: "Chapter 142 – Signal in the Midnight Veil",
    series: "Destiny Among the Stars",
    time: "3 hours ago",
  },
  {
    source: "Patreon",
    label: "Early Access",
    title: "Chapter 148 – The Tower Wakes",
    series: "Destiny Among the Stars",
    time: "1 day ago",
  },
  {
    source: "Blog",
    label: "Dev Log",
    title: "Designing the LitRPG System Behind Destiny",
    series: "Site Blog",
    time: "4 days ago",
  },
];

const tools = [
  {
    title: "LitRPG Tools",
    desc: "Create, track, and balance characters using the same system behind the books.",
  },
  {
    title: "Image Galleries",
    desc: "Concept art, character portraits, ship designs, and location mood boards.",
  },
  {
    title: "Shoutout Manager",
    desc: "Automated shoutout calendar for RoyalRoad swaps and cross-promo.",
  },
];

export default function UniversePortalHomepage() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-50">
      {/* Background image & overlay */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/demo/universe-portal-bg.webp')", // dynamic in real app
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/60" />

      {/* Page shell */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* NAVBAR */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-black">
              OW
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide uppercase text-emerald-300">
                O.C. Wanderer
              </div>
              <div className="text-xs text-neutral-300">
                Sci‑Fi & Fantasy Universes
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-200">
            <button className="hover:text-white transition-colors">Universes</button>
            <button className="hover:text-white transition-colors">Blog</button>
            <button className="hover:text-white transition-colors">Tools</button>
            <button className="hover:text-white transition-colors">About</button>
            <button className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors">
              Join the Newsletter
            </button>
          </nav>
        </header>

        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center pt-8 md:pt-16">
          {/* Left: copy */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-200 border border-white/10">
              Shared Multiverse Portal
            </p>
            <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Step into the worlds of
              <span className="block text-emerald-300">O.C. Wanderer</span>
            </h1>
            <p className="mt-4 text-neutral-200 text-base md:text-lg max-w-xl">
              Starships, sky‑pirates, cursed knights, and reluctant warlocks. One
              site to explore every series, follow new chapters, and get early
              access to the stories before they go live.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors">
                Start Reading (20 Free Chapters)
              </button>
              <button className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Browse all universes
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  RR
                </span>
                Live on RoyalRoad & ScribbleHub
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold">
                  ✦
                </span>
                Early chapters & extras on Patreon
              </div>
            </div>
          </div>

          {/* Right: featured universe card */}
          <div className="rounded-3xl bg-neutral-900/70 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl p-6 md:p-7 flex flex-col gap-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Featured Universe — 20 Free Chapters Available
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="h-40 w-28 flex-shrink-0 rounded-xl bg-gradient-to-b from-emerald-400 to-sky-700 shadow-lg overflow-hidden" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">
                  Destiny Among the Stars
                </h2>
                <p className="text-xs font-medium text-emerald-300 mb-2">
                  Sci‑Fi • LitRPG • Space Opera
                </p>
                <p className="text-sm text-neutral-200">
                  A twenty‑year‑old crew from New Hampshire steals humanity's
                  future and takes the first ship to Alpha Centauri.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] text-neutral-200">
                  <span className="rounded-full bg-white/10 px-3 py-1">Portal Delving</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">System‑LitRPG</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">Found Family</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-neutral-300">
              <div className="flex items-center justify-between">
                <span>Continue Reading on RoyalRoad</span>
                <span className="text-emerald-300 font-semibold">Ch. 142</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next early chapter on Patreon</span>
                <span className="text-pink-300 font-semibold">Tomorrow</span>
              </div>
            </div>
          </div>
        </section>

        {/* UNIVERSE GRID */}
        <section className="mt-16 md:mt-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Explore the universes
            </h2>
            <button className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300 hover:text-white">
              View all series
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {universes.map((u) => (
              <article
                key={u.id}
                className="group rounded-3xl bg-neutral-900/80 border border-white/10 p-5 sm:p-6 md:p-7 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="h-32 w-24 flex-shrink-0 rounded-xl bg-gradient-to-b from-slate-200/70 to-slate-800/80 group-hover:scale-[1.02] transition-transform" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {u.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-emerald-200">
                      {u.tag}
                    </p>
                    <p className="mt-2 text-sm text-neutral-200 line-clamp-3">
                      {u.blurb}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-300">
                  <span>Read Chapters 1–20 On‑Site • Continue on RR • Early Access on Patreon</span>
                  <button className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-semibold text-white group-hover:bg-emerald-500 group-hover:text-neutral-950 transition-colors">
                    {u.cta}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ACTIVITY FEED + TOOLS */}
        <section className="mt-16 md:mt-20 grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Activity feed */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Latest from the multiverse (Blog • RR Updates • Patreon Redirects)
            </h2>
            <div className="space-y-3">
              {activity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-2xl bg-neutral-900/80 border border-white/10 px-4 py-3 backdrop-blur-xl"
                >
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[0.65rem] font-semibold uppercase text-neutral-100">
                    {item.source}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="flex items-center gap-2 text-xs text-emerald-300 mb-0.5">
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-neutral-400">•</span>
                      <span className="text-neutral-300">{item.series}</span>
                    </div>
                    <div className="text-neutral-50 font-medium">
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-400">
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="rounded-3xl bg-neutral-900/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl shadow-black/50">
            <h2 className="text-xl font-bold text-white mb-2">
              For readers & nerds who love systems
            </h2>
            <p className="text-sm text-neutral-300 mb-4">
              Dive deeper with tools built around the stories: stat trackers,
              image galleries, and utilities for fellow authors.
            </p>
            <div className="space-y-3">
              {tools.map((tool) => (
                <div
                  key={tool.title}
                  className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-neutral-100 flex flex-col gap-1"
                >
                  <div className="font-semibold">{tool.title}</div>
                  <div className="text-xs text-neutral-300">{tool.desc}</div>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 hover:text-neutral-950 transition-colors">
              Open tools hub
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-16 border-t border-white/10 pt-6 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div>© {new Date().getFullYear()} O.C. Wanderer. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <span>RoyalRoad</span>
            <span>Patreon</span>
            <span>Discord</span>
            <span>Instagram</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function BlogIndexPage() {
  // In the real app, posts, tags, and filters would come from your MySQL-backed API.
  const posts = [
    {
      id: 1,
      title: "Dev Log: Building the Multiverse Portal UI",
      slug: "dev-log-multiverse-portal-ui",
      universe: "Destiny Among the Stars",
      tags: ["dev log", "ui", "author platform"],
      coverImage: "/images/blog/portal-ui-devlog.webp",
      excerpt:
        "A breakdown of the design decisions behind the universe hub, dynamic backgrounds, and how it all connects to RoyalRoad and Patreon.",
      readingTime: "6 min read",
      publishedAt: "Dec 10, 2025",
    },
    {
      id: 2,
      title: "Worldbuilding Notes: Alpha Centauri & the Varnathi Vaults",
      slug: "worldbuilding-alpha-centauri-varnathi",
      universe: "Destiny Among the Stars",
      tags: ["worldbuilding", "alpha centauri", "lore"],
      coverImage: "/images/blog/alpha-centauri-vaults.webp",
      excerpt:
        "Behind-the-scenes notes on how the System, Varnathi vaults, and TL9 technology interlock across the series.",
      readingTime: "8 min read",
      publishedAt: "Dec 3, 2025",
    },
    {
      id: 3,
      title: "Plotting Sky Pirates: Notes from Sinbad, Captain of the Sky",
      slug: "plotting-sky-pirates",
      universe: "Sinbad, Captain of the Sky",
      tags: ["sinbad", "process", "plotting"],
      coverImage: "/images/blog/sinbad-sky-pirates.webp",
      excerpt:
        "How I balance high-flying adventure, found family, and long-form serial pacing in a sky-pirate story.",
      readingTime: "7 min read",
      publishedAt: "Nov 28, 2025",
    },
  ];

  const tags = [
    "dev log",
    "worldbuilding",
    "alpha centauri",
    "process",
    "sinbad",
    "litrpg system",
  ];

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-50">
      {/* Background image & overlay – mirror universe portal styling */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/demo/blog-bg.webp')", // dynamic in real app
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/70" />

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* NAVBAR – shared shell with universe page */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-black">
              OW
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide uppercase text-emerald-300">
                O.C. Wanderer
              </div>
              <div className="text-xs text-neutral-300">Blog • Dev Logs • Lore</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-200">
            <button className="hover:text-white transition-colors">Universes</button>
            <button className="hover:text-white transition-colors">Blog</button>
            <button className="hover:text-white transition-colors">Tools</button>
            <button className="hover:text-white transition-colors">About</button>
            <button className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors">
              Join the Newsletter
            </button>
          </nav>
        </header>

        {/* HERO + SEARCH */}
        <section className="pt-6 md:pt-10">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-200 border border-white/10">
              Multiverse Blog
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Behind the pages, systems, and worlds of
              <span className="block text-emerald-300">Destiny & beyond</span>
            </h1>
            <p className="mt-3 text-neutral-200 text-sm md:text-base max-w-xl">
              Dev logs, worldbuilding deep dives, chapter announcements, and
              meta posts. These are the entries that cross-post out to
              Instagram, X, Facebook, and beyond.
            </p>
          </div>

          {/* Search + filters */}
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <label className="relative block">
                <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search posts by title, universe, or tag..."
                  className="w-full rounded-xl bg-neutral-900/80 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-400/70"
                />
              </label>
              <p className="mt-1 text-[0.7rem] text-neutral-400">
                Backed by MySQL search on title, tags, and universe.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[0.7rem] text-neutral-200">
              <span className="uppercase tracking-[0.2em] text-neutral-400 mr-1">
                Filter:
              </span>
              <button className="rounded-full bg-white/10 px-3 py-1 border border-white/10 hover:bg-emerald-500 hover:text-neutral-950 transition-colors">
                All posts
              </button>
              <button className="rounded-full bg-white/5 px-3 py-1 border border-white/10 hover:bg-white/10 transition-colors">
                Destiny
              </button>
              <button className="rounded-full bg-white/5 px-3 py-1 border border-white/10 hover:bg-white/10 transition-colors">
                Sinbad
              </button>
              <button className="rounded-full bg-white/5 px-3 py-1 border border-white/10 hover:bg-white/10 transition-colors">
                Worldbuilding
              </button>
            </div>
          </div>
        </section>

        {/* MAIN LAYOUT: posts + sidebar */}
        <section className="mt-10 grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Posts list */}
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group rounded-3xl bg-neutral-900/80 border border-white/10 overflow-hidden backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col sm:flex-row"
              >
                <div className="sm:w-48 h-40 sm:h-auto bg-neutral-800 flex-shrink-0">
                  {/* In real app, use next/image or img tag */}
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${post.coverImage})` }}
                  />
                </div>
                <div className="flex-1 p-5 sm:p-6 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                    <span className="font-semibold text-emerald-300">
                      {post.universe}
                    </span>
                    <span>{post.publishedAt} • {post.readingTime}</span>
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-neutral-200 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] text-neutral-200">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2.5 py-1 border border-white/10"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-emerald-300 font-semibold">
                    Read post →
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar: tags, featured, crosspost note */}
          <aside className="space-y-6">
            <div className="rounded-3xl bg-neutral-900/80 border border-white/10 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-white mb-3">
                Browse by tag
              </h3>
              <div className="flex flex-wrap gap-2 text-[0.7rem] text-neutral-200">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    className="rounded-full bg-white/5 px-3 py-1 border border-white/10 hover:bg-emerald-500 hover:text-neutral-950 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-neutral-900/80 border border-white/10 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-white mb-2">
                Crossposted automatically
              </h3>
              <p className="text-xs text-neutral-300 mb-3">
                New posts from this blog are mirrored out to Instagram, X,
                Facebook, and Discord via the backend. Write once, share
                everywhere.
              </p>
              <ul className="text-xs text-neutral-200 space-y-1">
                <li>• Generate OpenGraph image and short teaser.</li>
                <li>• Push summary + link to social APIs.</li>
                <li>• Track clicks back to this site in MySQL analytics.</li>
              </ul>
            </div>

            <div className="rounded-3xl bg-neutral-900/80 border border-white/10 p-5 backdrop-blur-xl">
              <h3 className="text-sm font-semibold text-white mb-2">
                Newsletter hook
              </h3>
              <p className="text-xs text-neutral-300 mb-3">
                Get monthly dev logs, big milestone posts, and hand-picked
                chapter updates.
              </p>
              <button className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors">
                Join the Newsletter
              </button>
            </div>
          </aside>
        </section>

        {/* FOOTER */}
        <footer className="mt-16 border-t border-white/10 pt-6 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div>© {new Date().getFullYear()} O.C. Wanderer. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <span>RoyalRoad</span>
            <span>Patreon</span>
            <span>Discord</span>
            <span>Instagram</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
