export type PlatformKey =
  | 'website'
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'vimeo'
  | 'discord'
  | 'patreon'
  | 'tiktok'
  | 'github'
  | 'linkedin';

export const PLATFORMS: PlatformKey[] = [
  'website',
  'twitter',
  'instagram',
  'facebook',
  'youtube',
  'vimeo',
  'discord',
  'patreon',
  'tiktok',
  'github',
  'linkedin',
];

export const LABELS: Record<PlatformKey, string> = {
  website: 'Website',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  discord: 'Discord',
  patreon: 'Patreon',
  tiktok: 'TikTok',
  github: 'GitHub',
  linkedin: 'LinkedIn',
};

export const PLACEHOLDERS: Record<PlatformKey, string> = {
  website: 'https://yoursite.com',
  twitter: 'https://x.com/username',
  instagram: 'https://instagram.com/username',
  facebook: 'https://facebook.com/username',
  youtube: 'https://youtube.com/@username',
  vimeo: 'https://vimeo.com/username',
  discord: 'https://discord.gg/invite',
  patreon: 'https://patreon.com/username',
  tiktok: 'https://tiktok.com/@username',
  github: 'https://github.com/username',
  linkedin: 'https://www.linkedin.com/in/your_profile/',
};
