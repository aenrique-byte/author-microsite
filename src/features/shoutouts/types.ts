export type ThemeColor = 'amber' | 'blue' | 'rose' | 'emerald' | 'violet' | 'cyan';

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface Story {
  id: string;
  title: string;
  link: string;
  coverImage: string;
  color: ThemeColor;
}

export interface AdminConfig {
  monthsToShow: number;
}

export interface AdminShoutout {
  id: string;
  label: string;
  code: string;
  storyId?: string; // If null, applies to all stories
}

export interface Availability {
  dateStr: string; // ISO YYYY-MM-DD
  storyId: string;
}

export interface Booking {
  id: string;
  dateStr: string;
  storyId: string;
  authorName: string;
  storyLink: string;
  shoutoutCode: string;
  email: string;
  status: BookingStatus;
  createdAt: number; // JavaScript timestamp (milliseconds)
}
