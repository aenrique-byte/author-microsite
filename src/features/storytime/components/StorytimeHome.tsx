import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllStories, loadProgress } from '../utils/api-story';
import { RenderedMarkdown } from './RenderedMarkdown';
import SocialIcons from '../../../components/SocialIcons';
import ThemeToggle from '../../../components/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

interface Story {
  id: string;
  title: string;
  cover: string;
  blurb?: string;
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

                      <Link
                        to={`/storytime/story/${story.id}`}
                        className={`inline-flex items-center rounded-lg border px-4 py-2 transition-colors ${
                          theme === 'light'
                            ? 'border-gray-400 text-gray-700 hover:border-gray-500 hover:bg-gray-100'
                            : 'border-white/30 text-white hover:border-white/50 hover:bg-white/10'
                        }`}
                      >
                        Details
                      </Link>
                    </div>

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
