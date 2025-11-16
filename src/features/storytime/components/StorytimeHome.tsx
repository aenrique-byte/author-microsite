import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllStories, loadProgress } from '../utils/api-story';
import { RenderedMarkdown } from './RenderedMarkdown';
import SocialIcons from '../../../components/SocialIcons';
import ThemeToggle from '../../../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { getRandomBackground } from '../../../utils/backgroundUtils';

interface Story {
  id: string;
  title: string;
  cover: string;
  blurb?: string;
  genres?: string[];
  chapter_count?: number;
  total_likes?: number;
  total_words?: number;
  external_links?: { label: string; url: string }[];
  progress?: {
    chapterIndex?: number;
    percent?: number;
  } | null;
}

interface EnlargedImage {
  src: string;
  title: string;
}

export function StorytimeHome() {
  const { theme } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [enlargedImage, setEnlargedImage] = useState<EnlargedImage | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [expandedGenres, setExpandedGenres] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "My Stories";
  }, []);

  useEffect(() => {
    async function loadData() {
      const storiesData = await getAllStories();
      const storiesWithProgress = storiesData.map((story: Story) => ({
        ...story,
        progress: loadProgress(story.id),
      }));
      setStories(storiesWithProgress);
      
      // Fetch author profile for background images
      try {
        const response = await fetch('/api/author/get.php');
        const data = await response.json();
        if (data.success) {
          setAuthorProfile(data.profile);
        }
      } catch (error) {
        console.error('Failed to fetch author profile:', error);
      }
    }
    loadData();
  }, []);

  const handleImageClick = (e: React.MouseEvent, imageSrc: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEnlargedImage({ src: imageSrc, title });
  };


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
        
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
          {/* Enhanced Breadcrumbs */}
          <div className="mb-6">
            <div className={`${cardClass} rounded-xl p-4`}>
              <div className={`flex items-center gap-2 text-sm ${subtextClass}`}>
                <a href="/" className={`hover:underline ${theme === 'light' ? 'hover:text-gray-900' : 'hover:text-neutral-200'}`}>
                  Home
                </a>
                <span>/</span>
                <span className={textClass}>Stories</span>
              </div>
            </div>
          </div>
        <h1 className={`mb-12 text-center text-4xl font-bold tracking-tight ${textClass}`}>All Stories</h1>
        
        <ul className="space-y-8">
          {stories.map(story => (
            <li key={story.id}>
              <article className={`overflow-hidden rounded-xl border ${cardClass} shadow-lg transition-all ${
                theme === 'light' 
                  ? 'hover:border-gray-400 hover:bg-white/80' 
                  : 'hover:border-white/30 hover:bg-black/80'
              } hover:shadow-xl`}>
                <div className="flex flex-col lg:flex-row">
                  {/* Cover Image */}
                  <div className="lg:w-48 lg:flex-shrink-0 p-4">
                    <img 
                      src={story.cover} 
                      alt={`${story.title} cover`} 
                      className="w-full aspect-[2/3] cursor-pointer object-cover rounded-lg shadow-md transition-opacity hover:opacity-90"
                      onClick={(e) => handleImageClick(e, story.cover, story.title)}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <Link to={`/storytime/story/${story.id}`} className="group">
                        <h2 className={`mb-3 text-2xl font-bold ${textClass} transition-colors group-hover:text-blue-400`}>
                          {story.title}
                        </h2>
                      </Link>

                      {/* Meta: genres + chapter count + likes */}
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {Array.isArray(story.genres) && story.genres.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(expandedGenres[story.id] ? story.genres : story.genres.slice(0, 3)).map((g, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  theme === 'light'
                                    ? 'bg-gray-200 text-gray-800'
                                    : 'bg-white/10 text-neutral-200'
                                }`}
                              >
                                {g}
                              </span>
                            ))}
                            {story.genres.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setExpandedGenres(prev => ({ ...prev, [story.id]: !prev[story.id] }))}
                                className={`text-xs underline-offset-2 hover:underline ${subtextClass}`}
                              >
                                {expandedGenres[story.id] ? 'show less' : `+${story.genres.length - 3} more`}
                              </button>
                            )}
                          </div>
                        )}

                        {(story.chapter_count != null || story.total_likes != null || story.total_words != null) && Array.isArray(story.genres) && story.genres.length > 0 && (
                          <span className={`mx-2 ${subtextClass}`}>•</span>
                        )}

                        {(story.chapter_count != null || story.total_likes != null || story.total_words != null) && (
                          <div className={`flex items-center gap-3 ${subtextClass} text-sm`}>
                            <span>
                              {(story.chapter_count ?? 0).toLocaleString()} {(story.chapter_count ?? 0) === 1 ? 'chapter' : 'chapters'}
                            </span>
                            <span>•</span>
                            <span>
                              {(story.total_likes ?? 0).toLocaleString()} {(story.total_likes ?? 0) === 1 ? 'like' : 'likes'}
                            </span>
                            {story.total_words != null && (
                              <>
                                <span>•</span>
                                <span>
                                  {(story.total_words ?? 0).toLocaleString()} {(story.total_words ?? 0) === 1 ? 'word' : 'words'}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {story.blurb && (
                        <div className={`mb-6 ${subtextClass}`}>
                          <RenderedMarkdown 
                            markdown={story.blurb} 
                            className={`max-w-none prose prose-p:mb-3 ${theme === 'light' ? 'prose-gray' : 'prose-invert'}`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-1 flex flex-wrap gap-3">
                      <Link
                        to={`/storytime/story/${story.id}`}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        Start Reading
                      </Link>

                      {story.progress && typeof story.progress.chapterIndex === "number" && (
                        <Link
                          to={`/storytime/story/${story.id}/chapter/${story.progress.chapterIndex}`}
                          className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        >
                          Continue — Chapter {story.progress.chapterIndex}
                        </Link>
                      )}
                    </div>

                    {/* External platform links */}
                    {Array.isArray(story.external_links) && story.external_links.length > 0 && (
                      <div className={`mt-2 text-sm ${subtextClass}`}>
                        <span className="mr-2">Find on</span>
                        <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
                          {story.external_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline decoration-dotted ${
                                theme === 'light'
                                  ? 'text-blue-700 hover:text-blue-800'
                                  : 'text-blue-300 hover:text-blue-200'
                              }`}
                            >
                              <strong>{link.label}</strong>
                            </a>
                          ))}
                        </span>
                      </div>
                    )}

                    {/* Optional progress bar if you later compute percent */}
                    {typeof story.progress?.percent === "number" && (
                      <div className="mt-2">
                        <div className={`h-2 w-full rounded-full ${theme === 'light' ? 'bg-gray-300' : 'bg-white/20'}`}>
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${Math.max(0, Math.min(100, story.progress.percent))}%` }}
                          />
                        </div>
                        <p className={`mt-1 text-xs ${theme === 'light' ? 'text-gray-500' : 'text-neutral-400'}`}>
                          {Math.round(story.progress.percent)}% read
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {/* Zoom modal */}
        {enlargedImage && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setEnlargedImage(null)}
          >
            <div className="relative max-h-[92vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={enlargedImage.src}
                alt={enlargedImage.title}
                className="max-h-[92vh] w-full object-contain"
              />
              <button
                onClick={() => setEnlargedImage(null)}
                className="absolute -top-3 -right-3 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
                aria-label="Close"
              >
                ×
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-sm text-white">
                {enlargedImage.title}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer with Social Icons and Copyright */}
        <footer className={`relative z-10 mt-16 border-t ${cardClass} py-8 ${
          theme === 'light' ? 'border-gray-300' : 'border-white/20'
        }`}>
          <div className="mx-auto max-w-6xl px-4">
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
