// CritiqueRoom Types
// Migrated from critiqueroom/types.ts with API-compatible updates

export enum FeedbackMode {
  LINE_LEVEL = 'Line-level feedback',
  BIG_PICTURE = 'Big-picture pacing',
  CHARACTER_VOICE = 'Character voice',
  WORLDBUILDING = 'Worldbuilding clarity',
  GRAMMAR = 'Grammar only',
  ROAST_ME = 'Roast me (Critical)',
  GENTLE = 'Gentle / Morale boost'
}

export enum ExpirationOption {
  H24 = '24 Hours',
  H72 = '72 Hours',
  D7 = '7 Days',
  NEVER = 'No Expiration'
}

export type FontCombo = 'LITERARY' | 'MODERN' | 'PAPERBACK';

export interface CommentReply {
  id: string;
  author: string;
  authorDiscordId?: string | null;
  content: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  paragraphIndex: number;
  startOffset?: number;
  endOffset?: number;
  textSelection?: string;
  content: string;
  author: string;
  authorDiscordId?: string | null;
  timestamp: number;
  status: 'open' | 'resolved' | 'implemented';
  replies: CommentReply[];
  rating?: 'useful' | 'irrelevant' | 'unclear';
}

export interface GlobalFeedback {
  id?: number;
  category: 'overall' | 'worked' | 'didnt-work' | 'confusing';
  text: string;
  author: string;
  authorDiscordId?: string | null;
  timestamp: number;
}

export interface WritingSection {
  id: string;
  label: string;
  paragraphIndex: number;
}

export interface Session {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId?: number | null;
  modes: FeedbackMode[];
  questions: string[];
  sections: WritingSection[];
  expiration: ExpirationOption;
  fontCombo: FontCombo;
  createdAt: number;
  expiresAt?: number | null;
  comments: Comment[];
  globalFeedback: GlobalFeedback[];
  passwordProtected?: boolean;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  globalName?: string | null;
  avatar?: string | null;
  displayName: string;
}

export interface FlowerIdentity {
  name: string;
  color: string;
  isDiscord?: boolean;
}

// Predefined flower identities for anonymous users
export const FLOWERS: FlowerIdentity[] = [
  { name: 'Katniss', color: '#4ade80' },
  { name: 'Sneezeweed', color: '#facc15' },
  { name: 'Toadflax', color: '#a855f7' },
  { name: 'Turtlehead', color: '#f472b6' },
  { name: 'Thimbleweed', color: '#e2e8f0' },
  { name: 'Lousewort', color: '#ef4444' },
  { name: 'Jonquil', color: '#fbbf24' },
  { name: 'Begonia', color: '#f97316' },
  { name: 'Canna', color: '#b91c1c' },
  { name: 'Freesia', color: '#3b82f6' },
  { name: 'Zinnia', color: '#d946ef' },
  { name: 'Lantana', color: '#14b8a6' },
];

// API Request/Response Types
export interface CreateSessionRequest {
  title: string;
  content: string;
  authorName: string;
  modes: string[];
  questions: string[];
  sections: WritingSection[];
  expiration: string;
  fontCombo: string;
  password?: string;
}

export interface CreateSessionResponse {
  id: string;
  createdAt: number;
  expiresAt: number | null;
}

export interface SessionWithMeta extends Session {
  isAuthor: boolean;
}

export interface CreateCommentRequest {
  sessionId: string;
  paragraphIndex: number;
  startOffset?: number;
  endOffset?: number;
  textSelection?: string;
  content: string;
  authorName: string;
}

export interface CreateFeedbackRequest {
  sessionId: string;
  category: GlobalFeedback['category'];
  text: string;
  authorName: string;
}
