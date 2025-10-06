export type Rating = "PG" | "X";

export interface ImageMeta {
  id?: number;
  src?: string;
  thumb?: string;
  title?: string;
  prompt?: string;
  parameters?: string;
  checkpoint?: string | null;
  loras?: string[];
  width?: number;
  height?: number;
}

export interface Socials {
  [key: string]: string;
}

export interface ApiGalleryCardItem {
  id: number;
  slug: string;
  title: string;
  description?: string;
  rating: "PG" | "X";
  image_count: number;
  like_count: number;
  comment_count: number;
  hero_thumb: string | null;
  hero_width: number | null;
  hero_height: number | null;
}
