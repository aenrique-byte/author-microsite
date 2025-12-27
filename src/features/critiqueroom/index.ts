/**
 * CritiqueRoom Feature Module
 * Export all components and utilities for use in the main app
 */

// Main route component
export { default as CritiqueRoomRoute } from './CritiqueRoomRoute';

// Page components
export { CritiqueRoomHome } from './components/CritiqueRoomHome';
export { WriterWorkspace } from './components/WriterWorkspace';
export { CritiqueSession } from './components/CritiqueSession';
export { SessionList } from './components/SessionList';

// API and utilities
export { critiqueRoomAPI } from './utils/api-critiqueroom';
export { 
  getSessionIdentity, 
  setSessionIdentity, 
  getPreferredFontSize, 
  setPreferredFontSize,
  isLocalAuthor,
  markAsLocalAuthor 
} from './utils/api-critiqueroom';

// Types
export * from './types';
