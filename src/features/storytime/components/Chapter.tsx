import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getStory, getChapterContent, saveProgress, loadProgress, findMaxChapterIndex, getAuthorProfile, getChapterDetails } from '../utils/api-story';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { CommentsSection } from './CommentsSection';
import SocialIcons from '../../../components/SocialIcons';
import ThemeToggle from '../../../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth, canEditChapter } from '../../../contexts/AuthContext';
import { ChapterEditModal } from './ChapterEditModal';
import { analytics, ChapterDepthTracker } from '../../../lib/analytics';
import { API_BASE } from '../../../lib/apiBase';

import type { Story, AuthorProfile, ChapterDetails } from '../utils/api-story';

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
          const maxChapter = await findMaxChapterIndex(storyData);
          if (nextId <= maxChapter) {
            setNextChapterId(nextId);
          } else {
            setNextChapterId(null);
          }
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
    const dirtyHtml = marked.parse(chapterContent) as string;
    
    // Replace <hr> with responsive page break images
    const breakImage = story?.breakImage || '/api/uploads/page_break.png';
    const htmlWithBreaks = dirtyHtml.replace(/<hr\s*\/?>/g, `<img src="${breakImage}" alt="" class="page-break" />`);
    
    return { __html: DOMPurify.sanitize(htmlWithBreaks, { ADD_TAGS: ["img"], ADD_ATTR: ['src', 'alt', 'title', 'class'] }) };
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
    const style = document.createElement('style');
    style.id = 'story-break-style';
    style.textContent = `
      .page-break {
        display: block;
        width: 100%;
        height: auto;
        margin: 2rem 0;
        filter: ${theme === 'light' ? 'drop-shadow(0 0 10px rgba(0,0,0,0.45)) drop-shadow(0 0 20px rgba(0,0,0,0.25))' : 'none'};
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('story-break-style');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [theme]);

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
  const backgroundImage = authorProfile 
    ? (theme === 'light'
        ? (authorProfile.background_image_light || authorProfile.background_image || '/images/lofi_light_bg.webp')
        : (authorProfile.background_image_dark || authorProfile.background_image || '/images/lofi_bg.webp'))
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
          className="fixed inset-0 w-full h-full -z-10"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        {/* overlay */}
        <div className={`fixed inset-0 ${overlayClass} -z-10`} />
        
        <div className="relative z-10 min-h-screen grid grid-rows-[auto,1fr] chapter-layout">
        <header className={`border-b ${cardClass} ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}>
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
        </header>
        <main ref={mainRef} className="overflow-y-auto">
          <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-6 py-8">
            <article className={`prose max-w-[80ch] mx-auto prose-p:mb-6 text-left ${cardClass} rounded-xl p-6 ${
              theme === 'light' ? 'prose-gray' : 'prose-invert'
            }`} dangerouslySetInnerHTML={sanitizedHtml} />
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
