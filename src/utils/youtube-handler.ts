/**
 * YouTube Embed Handler
 * 
 * Reconstructs YouTube iframes from data attributes on the frontend.
 * This is necessary because the PHP HTML sanitizer strips <iframe> tags
 * for security reasons, but preserves the container div with data-youtube-id.
 * 
 * The TipTap YouTubeExtension generates:
 *   <div data-youtube-video="true" data-youtube-id="VIDEO_ID" class="youtube-embed">
 *     <iframe>...</iframe>
 *   </div>
 * 
 * After PHP sanitization:
 *   <div data-youtube-video="true" data-youtube-id="VIDEO_ID" class="youtube-embed">
 *     <!-- iframe stripped -->
 *   </div>
 * 
 * This handler finds those containers and rebuilds the iframes client-side.
 */

/**
 * Process all YouTube embed placeholders in a container element.
 * Finds elements with [data-youtube-video="true"] and injects iframes.
 * 
 * @param container - DOM element to search within (defaults to document.body)
 */
export function processYouTubeEmbeds(container: HTMLElement | Document = document): void {
  const embeds = container.querySelectorAll('[data-youtube-video="true"]');
  
  embeds.forEach((element) => {
    const videoId = element.getAttribute('data-youtube-id');
    
    // Skip if no video ID or iframe already exists
    if (!videoId || element.querySelector('iframe')) {
      return;
    }
    
    // Validate video ID format (YouTube IDs are 11 characters, alphanumeric + _-)
    if (!/^[\w-]{11}$/.test(videoId)) {
      console.warn(`Invalid YouTube video ID: ${videoId}`);
      return;
    }
    
    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.width = '560';
    iframe.height = '315';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy'; // Lazy load for performance
    iframe.title = 'YouTube video'; // Accessibility
    
    // Clear any placeholder content and insert iframe
    element.innerHTML = '';
    element.appendChild(iframe);
  });
}

/**
 * Initialize YouTube embed processing for the entire document.
 * Useful for initial page load.
 */
export function initYouTubeEmbeds(): void {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => processYouTubeEmbeds());
  } else {
    processYouTubeEmbeds();
  }
}

export default processYouTubeEmbeds;
