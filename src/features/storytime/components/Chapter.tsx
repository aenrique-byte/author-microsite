import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getStory, getChapterContent, saveProgress, loadProgress, getAuthorProfile, getChapterDetails } from '../utils/api-story';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { CommentsSection } from './CommentsSection';
import SocialIcons from '../../../components/SocialIcons';
import NewsletterCTA from '../../../components/NewsletterCTA';
import PatreonCTA from '../../../components/PatreonCTA';
import ThemeToggle from '../../../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth, canEditChapter } from '../../../contexts/AuthContext';
import { ChapterEditModal } from './ChapterEditModal';
import { analytics, ChapterDepthTracker } from '../../../lib/analytics';
import { API_BASE } from '../../../lib/apiBase';
import { getRandomBackground } from '../../../utils/backgroundUtils';

import type { Story, AuthorProfile, ChapterDetails } from '../utils/api-story';

// Color mapping for custom markdown color syntax
const COLOR_MAP: Record<string, string> = {
  yellow: '#FFD700',
  gold: '#FFD700',
  gray: '#808080',
  grey: '#808080',
  red: '#DC143C',
  crimson: '#DC143C',
  purple: '#9370DB',
  violet: '#9370DB',
  blue: '#4169E1',
  royalblue: '#4169E1',
  green: '#32CD32',
  lime: '#32CD32',
  orange: '#FF8C00',
  darkorange: '#FF8C00',
  pink: '#FF69B4',
  hotpink: '#FF69B4',
  cyan: '#00CED1',
  darkturquoise: '#00CED1',
  magenta: '#FF00FF',
  fuchsia: '#FF00FF',
  brown: '#8B4513',
  saddlebrown: '#8B4513',
  white: '#FFFFFF',
  black: '#000000',
  silver: '#C0C0C0',
  maroon: '#800000',
  olive: '#808000',
  navy: '#000080',
  teal: '#008080',
  aqua: '#00FFFF',
  indigo: '#4B0082',
  coral: '#FF7F50',
  salmon: '#FA8072',
  khaki: '#F0E68C',
  lavender: '#E6E6FA',
  mint: '#98FF98',
  peach: '#FFDAB9',
  rose: '#FFE4E1',
  sky: '#87CEEB',
  tan: '#D2B48C',
};

// Parse custom color syntax: {color}text{/color}
function parseColorSyntax(text: string): string {
  return text.replace(/\{(\w+)\}([\s\S]*?)\{\/\1\}/g, (match, color, content) => {
    const hexColor = COLOR_MAP[color.toLowerCase()];
    if (hexColor) {
      return `<span class="story-color" style="--story-color: ${hexColor};">${content}</span>`;
    }
    return match; // Return original if color not found
  });
}

export function Chapter() {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [chapterContent, setChapterContent] = useState('');
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [chapterDetails, setChapterDetails] = useState<ChapterDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextChapterId, setNextChapterId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const depthTrackerRef = useRef<ChapterDepthTracker | null>(null);


  useEffect(() => {
    async function loadData() {
      if (!storyId || !chapterId) return;
      
      setLoading(true);
      const [storyData, authorData] = await Promise.all([
        getStory(storyId),
        getAuthorProfile()
      ]);
      
      setStory(storyData);
      setAuthorProfile(authorData);
      
      if (storyData) {
        try {
          const [content, chapterData] = await Promise.all([
            getChapterContent(storyData, chapterId),
            getChapterDetails(storyData, chapterId)
          ]);
          
          setChapterContent(content);
          setChapterDetails(chapterData);

          const nextId = parseInt(chapterId, 10) + 1;
          // Determine existence of next chapter by querying its details (respects published filter)
          const nextMeta = await getChapterDetails(storyData, String(nextId));
          setNextChapterId(nextMeta ? nextId : null);
        } catch (error) {
          setChapterContent('# Chapter not found');
          setNextChapterId(null);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [storyId, chapterId]);

  // Analytics tracking effect
  useEffect(() => {
    if (loading || !story || !storyId || !chapterId) return;
    const ac = new AbortController();

    // Setup analytics tracking - renamed to avoid shadowing imported getChapterDetails
    const setupAnalytics = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/chapters/list.php?story_slug=${encodeURIComponent(storyId)}&chapter_number=${chapterId}`,
          { signal: ac.signal }
        );
        const data = await response.json();
        
        if (data.success && data.chapters && data.chapters.length > 0) {
          const chapter = data.chapters[0];
          const storyIdNum = Number(story.id) || 0;
          
          // Track chapter view
          analytics.trackChapterView({
            chapterId: chapter.id,
            storyId: storyIdNum,
            storySlug: storyId,
            chapterNumber: Number(chapterId)
          });

          // Set up depth tracking
          if (mainRef.current) {
            depthTrackerRef.current = new ChapterDepthTracker(mainRef.current);
          }

          // Cleanup function
          return () => {
            if (depthTrackerRef.current) {
              depthTrackerRef.current.destroy({
                chapterId: chapter.id,
                storyId: storyIdNum
              });
              depthTrackerRef.current = null;
            }
          };
        }
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.debug('Failed to track chapter analytics:', error);
        }
      }
    };

    const cleanup = setupAnalytics();
    
    return () => {
      ac.abort();
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [loading, story, storyId, chapterId]);

  const sanitizedHtml = useMemo(() => {
    if (!chapterContent) return { __html: '' };

    // First parse markdown
    let dirtyHtml = marked.parse(chapterContent) as string;

    // Replace <hr> with responsive page break images
    const breakImage = story?.breakImage || '/api/uploads/page_break.png';
    const htmlWithBreaks = dirtyHtml.replace(/<hr\s*\/?>/g, `<img src="${breakImage}" alt="" class="page-break" />`);

    // Apply drop cap if enabled for this story
    if (story?.enableDropCap) {
      // First, apply drop cap to the very first <p> tag
      let result = htmlWithBreaks.replace(/(<p[^>]*>)([^<\s])/, (_match, openTag, firstChar) => {
        return `${openTag}<span class="drop-cap">${firstChar}</span>`;
      });

      // Then, apply drop cap to any <p> tag that comes immediately after a page break image
      // Look for pattern: </p> followed by page-break img, followed by <p>
      result = result.replace(
        /(class="page-break"[^>]*>\s*)(<p[^>]*>)([^<\s])/g,
        (_match, beforeP, openTag, firstChar) => {
          return `${beforeP}${openTag}<span class="drop-cap">${firstChar}</span>`;
        }
      );

      dirtyHtml = result;
    } else {
      dirtyHtml = htmlWithBreaks;
    }

    // Then apply custom color syntax to the HTML output
    const colorParsed = parseColorSyntax(dirtyHtml);

    // Sanitize, allowing style attribute for colored text
    return { __html: DOMPurify.sanitize(colorParsed, {
      ADD_TAGS: ["img", "span"],
      ADD_ATTR: ['src', 'alt', 'title', 'class', 'style']
    }) };
  }, [chapterContent, story]);

  // Effect for restoring scroll position
  useEffect(() => {
    if (loading || !storyId || !chapterId) return;
    const prog = loadProgress(storyId);
    if (prog && prog.chapterIndex === parseInt(chapterId, 10)) {
      mainRef.current?.scrollTo({ top: prog.scrollY, behavior: 'auto' });
    }
  }, [loading, storyId, chapterId]);

  // Effect for saving scroll position
  useEffect(() => {
    // Wait for content to be loaded before setting up scroll listener
    if (loading || !storyId || !chapterId) return;
    
    const mainEl = mainRef.current;
    if (!mainEl) return;

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        try {
          saveProgress(storyId, { chapterIndex: parseInt(chapterId, 10), scrollY: mainEl.scrollTop });
        } catch (error) {
          console.warn('Failed to save reading progress:', error);
        }
      });
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [storyId, chapterId, loading]);

  useEffect(() => {
    // Load Google Fonts for drop cap if needed
    if (story?.enableDropCap && story?.dropCapFont && story.dropCapFont !== 'serif') {
      const fontMap: Record<string, string> = {
        cinzel: 'Cinzel:wght@400;600;700',
        playfair: 'Playfair+Display:wght@400;600;700',
        cormorant: 'Cormorant:wght@400;600;700',
        unna: 'Unna:wght@400;700',
        crimson: 'Crimson+Pro:wght@400;600;700'
      };

      const fontQuery = fontMap[story.dropCapFont];
      if (fontQuery && !document.getElementById(`font-${story.dropCapFont}`)) {
        const link = document.createElement('link');
        link.id = `font-${story.dropCapFont}`;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
        document.head.appendChild(link);
      }
    }

    // Get font family for drop cap
    const getDropCapFont = () => {
      if (!story?.enableDropCap) return 'serif';
      const fontFamily = story.dropCapFont || 'serif';

      const fontFamilyMap: Record<string, string> = {
        serif: 'Georgia, serif',
        cinzel: '"Cinzel", serif',
        playfair: '"Playfair Display", serif',
        cormorant: '"Cormorant", serif',
        unna: '"Unna", serif',
        crimson: '"Crimson Pro", serif'
      };

      return fontFamilyMap[fontFamily] || 'Georgia, serif';
    };

    const style = document.createElement('style');
    style.id = 'story-break-style';
    style.textContent = `
      /* Drop cap styling */
      .drop-cap {
        float: left;
        font-size: 3.5em;
        line-height: 0.85;
        margin-right: 0.1em;
        margin-top: 0.05em;
        font-weight: 600;
        font-family: ${getDropCapFont()};
        ${theme === 'light' ? 'color: #1a1a1a;' : 'color: #f0f0f0;'}
      }

      .page-break {
        display: block;
        width: 100%;
        height: auto;
        margin: 2rem 0;
        filter: ${theme === 'light' ? 'drop-shadow(0 0 10px rgba(0,0,0,0.45)) drop-shadow(0 0 20px rgba(0,0,0,0.25))' : 'none'};
      }

      /* Base color rule */
      .story-color,
      .story-color * {
        color: var(--story-color) !important;
      }

      /* Theme-aware contrast adjustments */
      ${theme === 'light' ? `
        .story-color,
        .story-color * {
          --story-color: color-mix(in oklch, var(--story-color) 65%, black);
        }

        /* Fallback for browsers without color-mix support */
        @supports not (color: color-mix(in oklch, black 10%, white)) {
          .story-color[style*="#FFD700"],
          .story-color[style*="ffd700"] { --story-color: #b8860b; } /* darker gold */
          .story-color[style*="#808080"],
          .story-color[style*="808080"] { --story-color: #4a4a4a; } /* darker gray */
        }
      ` : `
        .story-color,
        .story-color * {
          --story-color: color-mix(in oklch, var(--story-color) 90%, white);
        }

        /* Fallback for browsers without color-mix support */
        @supports not (color: color-mix(in oklch, black 10%, white)) {
          .story-color[style*="#FFD700"],
          .story-color[style*="ffd700"] { --story-color: #ffd24d; } /* brighter gold */
        }
      `}
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('story-break-style');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [theme, story?.enableDropCap, story?.dropCapFont]);

  if (loading) {
    return <div>Loading chapter...</div>;
  }

  if (!story || !authorProfile) {
    return <div>Loading chapter...</div>;
  }

  // Helper function to strip markdown formatting for social media
  const stripMarkdown = (text: string): string => {
    return text
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove line breaks and extra spaces
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper to get chapter display title
  const getChapterDisplayTitle = (): string => {
    if (!chapterId) return 'Chapter';

    const chapterNum = parseInt(chapterId, 10);
    const customTitle = chapterDetails?.title;

    // If chapter 0, show custom title or "Prologue"
    if (chapterNum === 0) {
      return customTitle || 'Prologue';
    }

    // If custom title exists, use it
    if (customTitle) {
      return customTitle;
    }

    // Otherwise use default "Chapter X"
    return `Chapter ${chapterId}`;
  };

  // SEO meta data - dynamic from database
  const baseDomain = authorProfile.site_domain || 'example.com';
  const chapterUrl = `https://${baseDomain}/storytime/story/${storyId}/chapter/${chapterId}`;
  const chapterTitle = getChapterDisplayTitle();
  const chapterDescription = `${chapterTitle} - ${story.title}. Continue reading this ${story.genres?.join(', ') || 'story'} by ${authorProfile.name}.`;
  const pageTitle = `${chapterTitle} - ${story.title} | ${authorProfile.name} | ${authorProfile.bio}`;
  
  // Guard story cover and create safe URL
  const coverUrl = story?.cover
    ? (story.cover.startsWith('http') ? story.cover : `https://${baseDomain}${story.cover}`)
    : `https://${baseDomain}/images/og-default.png`;
  
  // Extract first meaningful paragraph for better description - safer approach
  const contentPreview = chapterContent
    ? (() => {
        const stripped = stripMarkdown(chapterContent);
        return stripped.length > 160 ? stripped.slice(0, 160) + '…' : stripped || chapterDescription;
      })()
    : chapterDescription;

  // Use author profile background images with smart fallback logic
  // getRandomBackground handles comma-separated filenames and randomly selects one
  const backgroundImage = authorProfile
    ? (theme === 'light'
        ? getRandomBackground(
            authorProfile.background_image_light || authorProfile.background_image,
            '/images/lofi_light_bg.webp'
          )
        : getRandomBackground(
            authorProfile.background_image_dark || authorProfile.background_image,
            '/images/lofi_bg.webp'
          ))
    : (theme === 'light' ? '/images/lofi_light_bg.webp' : '/images/lofi_bg.webp')
  const overlayClass = theme === 'light' ? 'bg-white/60' : 'bg-black/40'
  const cardClass = theme === 'light' ? 'bg-white/70 border-gray-300' : 'bg-black/70 border-white/20'
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-white'
  const subtextClass = theme === 'light' ? 'text-gray-700' : 'text-neutral-300'

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={contentPreview} />
        <link rel="canonical" href={chapterUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${chapterTitle} - ${story.title}`} />
        <meta property="og:description" content={contentPreview} />
        <meta property="og:image" content={coverUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={chapterUrl} />
        <meta property="og:site_name" content={authorProfile.name} />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${chapterTitle} - ${story.title}`} />
        <meta name="twitter:description" content={contentPreview} />
        <meta name="twitter:image" content={coverUrl} />
        <meta name="twitter:creator" content="" />
        
        {/* Additional SEO */}
        <meta name="author" content={authorProfile.name} />
        <meta property="article:author" content={authorProfile.name} />
        <meta property="article:section" content={story.genres?.join(', ') || 'Fiction'} />
        {chapterDetails?.updated_at && (
          <meta property="article:modified_time" content={new Date(chapterDetails.updated_at).toISOString()} />
        )}
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `${chapterTitle} - ${story.title}`,
            "description": contentPreview,
            "author": {
              "@type": "Person",
              "name": authorProfile.name
            },
            "publisher": {
              "@type": "Person",
              "name": authorProfile.name
            },
            "url": chapterUrl,
            "image": coverUrl,
            "isPartOf": {
              "@type": "Book",
              "name": story.title,
              "url": `https://${baseDomain}/storytime/story/${storyId}`
            },
            "inLanguage": "en-US",
            ...(chapterDetails?.updated_at && {
              "dateModified": new Date(chapterDetails.updated_at).toISOString()
            })
          })}
        </script>
      </Helmet>
      <ThemeToggle />
      <div className="relative min-h-screen w-full">
        {/* Fixed background layer */}
        <div
          className="fixed inset-0 -z-10 bg-no-repeat bg-top [background-size:auto_100%] md:[background-size:100%_auto]"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundColor: theme === 'light' ? '#f7f7f7' : '#0a0a0a',
          }}
        />
        {/* overlay */}
        <div className={`fixed inset-0 ${overlayClass} -z-10`} />
        
        <div className="relative z-10 min-h-screen grid grid-rows-[auto,1fr] chapter-layout">
        <header className={`sticky top-0 z-50 border-b ${cardClass} ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}>
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className={`flex items-center justify-between`}>
              <div className={`flex items-center gap-2 text-sm ${subtextClass}`}>
                <a href="/" className={`hover:underline ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-neutral-200'}`}>
                  Home
                </a>
                <span>/</span>
                <Link to="/storytime" className={`hover:underline ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-neutral-200'}`}>
                  Stories
                </Link>
                <span>/</span>
                <Link to={`/storytime/story/${storyId}`} className={`hover:underline ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-neutral-200'}`}>
                  {story.title}
                </Link>
                <span>/</span>
                <span className={textClass}>{chapterTitle}</span>
              </div>

              {/* Edit button - only visible for logged-in users */}
              {canEditChapter(user) && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Sticky Audio Player - only show if soundtrack exists */}
          {chapterDetails?.soundtrack_url && (
            <div className={`border-t ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}>
              <div className="max-w-5xl mx-auto px-4 py-2">
                <div className="flex items-center gap-3">
                  <svg className={`w-5 h-5 flex-shrink-0 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <audio
                    src={chapterDetails.soundtrack_url}
                    controls
                    className={`w-full max-w-2xl rounded-lg ${
                      theme === 'dark' ? 'bg-neutral-900 border border-neutral-800 p-2' : ''
                    }`}
                    style={theme === 'dark' ? { colorScheme: 'dark' } : undefined}
                    preload="metadata"
                  />
                </div>
              </div>
            </div>
          )}
        </header>
        <main ref={mainRef} className="overflow-y-auto">
          <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-6 py-8">
            <article className={`prose max-w-[80ch] mx-auto prose-p:mb-6 text-left ${cardClass} rounded-xl p-6 ${
              theme === 'light' ? 'prose-gray' : 'prose-invert'
            }`} dangerouslySetInnerHTML={sanitizedHtml} />
          </div>
          <div className="max-w-3xl mx-auto px-4 md:px-6 pb-8">
            <div className={`text-center ${cardClass} border rounded-xl p-6`}>
              <h3 className={`text-xl font-bold ${textClass}`}>⭐ Enjoying the story?</h3>
              <p className={`mt-2 text-sm ${subtextClass}`}>
                Get notified when new chapters drop, or support me on Patreon for early access.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <NewsletterCTA variant="button" source="chapter_end" />
                <PatreonCTA variant="button" />
              </div>
            </div>
          </div>
          {nextChapterId && (
            <div className="max-w-3xl mx-auto px-4 md:px-6 pb-8 text-center">
              <div className={`${cardClass} rounded-xl p-6`}>
                <Link 
                  to={`/storytime/story/${storyId}/chapter/${nextChapterId}`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Next Chapter
                </Link>
              </div>
            </div>
          )}
        
        {/* Comments Section */}
        {storyId && chapterId && (
          <CommentsSection storyId={storyId} chapterId={parseInt(chapterId, 10)} />
        )}
        
          {/* Footer */}
          <footer className={`mt-16 border-t ${cardClass} py-8 ${
            theme === 'light' ? 'border-gray-300' : 'border-white/20'
          }`}>
            <div className="mx-auto max-w-3xl px-4">
              <div className="flex flex-col items-center gap-4">
                <SocialIcons variant="footer" showCopyright={false} />
                <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-neutral-400'}`}>
                  © {new Date().getFullYear()} All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </main>
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && storyId && chapterId && (
        <ChapterEditModal
          storySlug={storyId}
          chapterNumber={parseInt(chapterId, 10)}
          onClose={() => setShowEditModal(false)}
          onSaved={(updatedContent) => {
            setChapterContent(updatedContent);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}

export default Chapter;
