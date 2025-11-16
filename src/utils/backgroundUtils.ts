/**
 * Utility for handling random background image selection
 * Supports comma-separated filenames that get built into full URLs
 */

/**
 * Selects a random background image from a comma-separated list of filenames
 *
 * @param backgroundField - The background field value from profile (comma-separated filenames or single URL)
 * @param fallbackUrl - Default URL to use if no valid background is found
 * @returns A full URL to use as background image
 *
 * @example
 * // With filenames
 * getRandomBackground('image1.webp, image2.webp, image3.webp', '/default.webp')
 * // Returns: '/api/uploads/general/image2.webp' (randomly selected)
 *
 * // With full URL (backward compatible)
 * getRandomBackground('https://example.com/bg.jpg', '/default.webp')
 * // Returns: 'https://example.com/bg.jpg'
 *
 * // With single filename
 * getRandomBackground('myimage.webp', '/default.webp')
 * // Returns: '/api/uploads/general/myimage.webp'
 */
export function getRandomBackground(backgroundField: string | null | undefined, fallbackUrl: string): string {
  // If no field provided, use fallback
  if (!backgroundField || backgroundField.trim() === '') {
    return fallbackUrl;
  }

  // Split by comma and clean up whitespace
  const items = backgroundField.split(',').map(item => item.trim()).filter(item => item !== '');

  if (items.length === 0) {
    return fallbackUrl;
  }

  // Randomly select one item
  const selectedItem = items[Math.floor(Math.random() * items.length)];

  // If it's already a full URL (starts with http:// or https://), return as-is
  if (selectedItem.startsWith('http://') || selectedItem.startsWith('https://')) {
    return selectedItem;
  }

  // If it starts with a slash, it's already a path, return as-is
  if (selectedItem.startsWith('/')) {
    return selectedItem;
  }

  // Otherwise, build the full path with the uploads directory
  return `/api/uploads/general/${selectedItem}`;
}
