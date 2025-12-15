/**
 * Spoiler Handler
 * 
 * JavaScript functionality to make spoiler text clickable to reveal content.
 * Call initSpoilers() on blog post pages to enable click-to-reveal.
 */

/**
 * Initialize spoiler click handlers
 * Call this function when the blog content is loaded
 */
export function initSpoilers(container?: HTMLElement): void {
  const root = container || document;
  const spoilers = root.querySelectorAll('.spoiler, [data-spoiler="true"]');

  spoilers.forEach((spoiler) => {
    // Skip if already initialized
    if (spoiler.hasAttribute('data-spoiler-init')) return;
    spoiler.setAttribute('data-spoiler-init', 'true');

    spoiler.addEventListener('click', () => {
      spoiler.classList.toggle('revealed');
    });

    // Add keyboard support
    spoiler.setAttribute('tabindex', '0');
    spoiler.setAttribute('role', 'button');
    spoiler.setAttribute('aria-label', 'Click to reveal spoiler');
    
    spoiler.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
        e.preventDefault();
        spoiler.classList.toggle('revealed');
      }
    });
  });
}

/**
 * Initialize footnote smooth scrolling
 * Call this function when the blog content is loaded
 */
export function initFootnotes(container?: HTMLElement): void {
  const root = container || document;
  const footnoteLinks = root.querySelectorAll('.footnote-link, a[href^="#fn-"]');

  footnoteLinks.forEach((link) => {
    // Skip if already initialized
    if (link.hasAttribute('data-footnote-init')) return;
    link.setAttribute('data-footnote-init', 'true');

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href) return;

      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        target.classList.add('footnote-highlight');
        setTimeout(() => target.classList.remove('footnote-highlight'), 2000);
      }
    });
  });

  // Also add back-reference links
  const backrefs = root.querySelectorAll('.footnote-backref, a[href^="#fnref-"]');
  backrefs.forEach((link) => {
    if (link.hasAttribute('data-backref-init')) return;
    link.setAttribute('data-backref-init', 'true');

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href) return;

      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

/**
 * Initialize all blog content features (spoilers + footnotes)
 */
export function initBlogContent(container?: HTMLElement): void {
  initSpoilers(container);
  initFootnotes(container);
}

export default initBlogContent;
