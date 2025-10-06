import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getStory, loadProgress, resetProgress, getAuthorProfile } from '../utils/api-story';
import { RenderedMarkdown } from './RenderedMarkdown';
import SocialIcons from '../../../components/SocialIcons';
import ThemeToggle from '../../../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE } from '../../../lib/apiBase';
import { analytics } from '../../../lib/analytics';

import type { Story, Chapter, Progress, AuthorProfile } from '../utils/api-story';

export function Story() {
  const { storyId } = useParams<{ storyId: string }>();
  const { theme } = useTheme();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chaptersPage, setChaptersPage] = useState(1);
  const [totalChapters, setTotalChapters] = useState(0);
  const [loadingMoreChapters, setLoadingMoreChapters] = useState(false);
  const [hasMoreChapters, setHasMoreChapters] = useState(false);


  // Load chapters with pagination
  const loadChapters = async (page: number = 1, append: boolean = false) => {
    if (!storyId) return;
    
    if (!append) setLoadingMoreChapters(true);
    
    try {
      const response = await fetch(`${API_BASE}/chapters/list.php?story_slug=${encodeURIComponent(storyId)}&page=${page}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        const newChapters: Chapter[] = (data.chapters || []).map((chapter: any) => ({
          num: chapter.chapter_number,
          title: chapter.title,
          id: chapter.id,
          status: chapter.status,
          like_count: chapter.like_count || 0,
          comment_count: chapter.comment_count || 0
        }));
        
        if (append) {
          setChapters(prev => [...prev, ...newChapters]);
        } else {
          setChapters(newChapters);
        }
        
        setTotalChapters(data.total || 0);
        setHasMoreChapters((data.page || 1) * (data.limit || 20) < (data.total || 0));
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoadingMoreChapters(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!storyId) return;
      
      setLoading(true);
      const [storyData, authorData] = await Promise.all([
        getStory(storyId),
        getAuthorProfile()
      ]);
      
      setStory(storyData);
      setAuthorProfile(authorData);
      setProgress(loadProgress(storyId));
      
      if (storyData) {
        await loadChapters(1, false);
      }
      setLoading(false);
    }
    loadData();
  }, [storyId]);

  // Analytics tracking effect
  useEffect(() => {
    if (loading || !story || !storyId) return;

    // Track story view
    analytics.trackStoryView(storyId, parseInt(story.id) || 0);
  }, [loading, story, storyId]);

  const handleLoadMoreChapters = () => {
    if (!loadingMoreChapters && hasMoreChapters) {
      const nextPage = chaptersPage + 1;
      setChaptersPage(nextPage);
      loadChapters(nextPage, true);
    }
  };

  const handleResetProgress = () => {
    if (!storyId) return;
    resetProgress(storyId);
    setProgress(null);
  };

  // Helper to get chapter display title
  const getChapterDisplayTitle = (ch: Chapter): string => {
    // If custom title exists, use it
    if (ch.title) {
      return ch.title;
    }

    // If chapter 0, default to "Prologue"
    if (ch.num === 0) {
      return 'Prologue';
    }

    // Otherwise use default "Chapter X"
    return `Chapter ${ch.num}`;
  };

  if (loading) {
    return <div>Loading story...</div>;
  }

  if (!story || !authorProfile) {
    return <div>Loading story...</div>;
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

  // SEO meta data - completely dynamic from database
  const baseDomain = authorProfile.site_domain || 'example.com';
  const storyUrl = `https://${baseDomain}/storytime/story/${storyId}`;
  const storyDescription = story.blurb 
    ? stripMarkdown(story.blurb).substring(0, 160) + (stripMarkdown(story.blurb).length > 160 ? '...' : '')
    : `Read ${story.title}, a ${story.genres?.join(', ') || 'story'} by ${authorProfile.name}. ${authorProfile.tagline}`;
  const storyTitle = `${story.title} | ${authorProfile.name} | ${authorProfile.bio}`;
  
  // Dynamic keywords from database
  const allKeywords = [
    ...(story.primary_keywords ? story.primary_keywords.split(',').map(k => k.trim()) : []),
    ...(story.longtail_keywords ? story.longtail_keywords.split(',').map(k => k.trim()) : []),
    'web serial', 'online novel', 'illustrated story' // fallback keywords
  ].filter(Boolean).join(', ');
  
  // Dynamic genres from database
  const storyGenres = story.genres && story.genres.length > 0 
    ? story.genres 
    : ['Fiction', 'Web Serial']; // fallback genres

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
        <title>{storyTitle}</title>
        <meta name="description" content={storyDescription} />
        <link rel="canonical" href={storyUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={storyDescription} />
        <meta property="og:image" content={story.cover.startsWith('http') ? story.cover : `https://${baseDomain}${story.cover}`} />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={storyUrl} />
        <meta property="og:site_name" content={authorProfile.name} />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={story.title} />
        <meta name="twitter:description" content={storyDescription} />
        <meta name="twitter:image" content={story.cover.startsWith('http') ? story.cover : `https://${baseDomain}${story.cover}`} />
        <meta name="twitter:creator" content="" />
        
        {/* Additional SEO - Dynamic from database */}
        <meta name="author" content={authorProfile.name} />
        <meta name="keywords" content={allKeywords} />
        <meta property="book:author" content={authorProfile.name} />
        <meta property="book:genre" content={storyGenres.join(', ')} />
        {story.target_audience && (
          <meta name="audience" content={story.target_audience} />
        )}
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "name": story.title,
            "description": storyDescription,
            "author": {
              "@type": "Person",
              "name": authorProfile.name
            },
            "genre": storyGenres,
            "url": storyUrl,
            "image": story.cover.startsWith('http') ? story.cover : `https://${baseDomain}${story.cover}`,
            "publisher": {
              "@type": "Person",
              "name": authorProfile.name
            },
            "inLanguage": "en-US"
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
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
          {/* Enhanced Breadcrumbs */}
          <div className="mb-6">
            <div className={`${cardClass} rounded-xl p-4`}>
              <div className={`flex items-center gap-2 text-sm ${subtextClass}`}>
                <a href="/" className={`hover:underline ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-neutral-200'}`}>
                  Home
                </a>
                <span>/</span>
                <Link to="/storytime" className={`hover:underline ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-neutral-200'}`}>
                  Stories
                </Link>
                <span>/</span>
                <span className={textClass}>{story.title}</span>
              </div>
            </div>
          </div>
      
          <div className={`${cardClass} rounded-xl p-6 mb-6`}>
            <div className="flex items-start gap-6">
              <img src={story.cover} alt={`${story.title} cover`} className="w-32 h-auto rounded-md flex-shrink-0" />
              <div className="text-left">
                <h1 className={`text-3xl font-bold ${textClass}`}>{story.title}</h1>
                {story.blurb && <RenderedMarkdown 
                  markdown={story.blurb} 
                  className={`mt-2 ${subtextClass} prose ${theme === 'light' ? 'prose-gray' : 'prose-invert'}`}
                />}
              </div>
            </div>
          </div>
          <div className={`${cardClass} rounded-xl p-6 mb-6`}>
            <div className="flex gap-2">
              {chapters && chapters.length > 0 && (
                <Link to={`/storytime/story/${storyId}/chapter/${story.startIndex}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Start reading
                </Link>
              )}
              {progress && typeof progress.chapterIndex === "number" && (
                <Link to={`/storytime/story/${storyId}/chapter/${progress.chapterIndex}`} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  Continue — Chapter {progress.chapterIndex}
                </Link>
              )}
              {progress && (
                <button onClick={handleResetProgress} className={`px-4 py-2 border rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'border-gray-400 text-gray-700 hover:bg-gray-100'
                    : 'border-white/30 text-white hover:bg-white/10'
                }`}>
                  Reset progress
                </button>
              )}
            </div>
          </div>
          <div className={`${cardClass} rounded-xl p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${textClass}`}>Chapters</h2>
              {totalChapters > 0 && (
                <span className={`text-sm ${subtextClass}`}>
                  Showing {chapters.length} of {totalChapters}
                </span>
              )}
            </div>
            {!chapters && <p className={subtextClass}>Loading…</p>}
            {chapters && (
              <>
                <ul className="space-y-2">
                  {chapters.map((ch) => (
                    <li key={ch.num} className={`flex justify-between border rounded-xl p-3 transition-colors ${
                      theme === 'light'
                        ? 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}>
                      <Link to={`/storytime/story/${storyId}/chapter/${ch.num}`} className={`hover:underline ${
                        theme === 'light' ? 'text-gray-800 hover:text-blue-600' : 'text-neutral-200 hover:text-blue-400'
                      }`}>
                        {getChapterDisplayTitle(ch)}
                      </Link>
                      {progress && progress.chapterIndex === ch.num && <span className={`text-xs ${
                        theme === 'light' ? 'text-gray-500' : 'text-neutral-400'
                      }`}>Last read</span>}
                    </li>
                  ))}
                </ul>
                
                {/* Load More Button */}
                {hasMoreChapters && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleLoadMoreChapters}
                      disabled={loadingMoreChapters}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        theme === 'light'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                          : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                      }`}
                    >
                      {loadingMoreChapters ? 'Loading...' : 'Load More Chapters'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
      
          {/* Footer with Social Icons and Copyright */}
          <footer className={`mt-16 border-t ${cardClass} rounded-xl py-8 ${
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
        </div>
      </div>
    </>
  );
}

export default Story;
