
/**
 * CritiqueSession - Feedback interface for critique sessions
 * Migrated from critiqueroom/pages/FeedbackPage.tsx with API integration
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Session, Comment, FeedbackMode, FontCombo, GlobalFeedback, FLOWERS } from '../types';
import type { FlowerIdentity } from '../types';
import { 
  critiqueRoomAPI, 
  getSessionIdentity, 
  setSessionIdentity as saveSessionIdentity, 
  getPreferredFontSize,
  isLocalAuthor 
} from '../utils/api-critiqueroom';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  Copy,
  Check,
  X,
  Flower2,
  ThumbsUp,
  Download,
  Lock,
  Lightbulb,
  Frown,
  User,
  Layers,
  ChevronDown,
  ChevronUp,
  Type,
  Minus,
  Plus,
  ChevronLeft,
  CalendarPlus,
  Settings,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import { useTheme } from '../../storytime/contexts/ThemeContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FeedbackExportModal } from './FeedbackExportModal';

// Configure marked for inline-only rendering (no block elements)
marked.setOptions({
  breaks: false,
  gfm: true,
});

// CommentCard component - defined outside CritiqueSession to prevent remounting on state changes
interface CommentCardProps {
  comment: Comment;
  isAuthor: boolean;
  isDark: boolean;
  expandedComments: Set<string>;
  replyText: { [id: string]: string };
  onToggleExpand: (id: string) => void;
  onStatusUpdate: (commentId: string, status: Comment['status']) => void;
  onRateComment: (commentId: string, rating: Comment['rating']) => void;
  onReply: (commentId: string) => void;
  onReplyTextChange: (commentId: string, text: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ 
  comment: c, 
  isAuthor, 
  isDark,
  expandedComments,
  replyText,
  onToggleExpand,
  onStatusUpdate,
  onRateComment,
  onReply,
  onReplyTextChange
}) => {
  const flower = FLOWERS.find(f => f.name === c.author) || (c.author.includes('#') ? { color: '#5865F2' } : null);
  const isMinimized = (c.status === 'resolved' || c.status === 'implemented') && !expandedComments.has(c.id);
  
  const cardBg = c.status === 'implemented' 
    ? (isDark ? 'bg-emerald-900/30 border-emerald-700/50' : 'bg-emerald-50 border-emerald-100') 
    : c.status === 'resolved' 
    ? (isDark ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-100') 
    : (isDark ? 'bg-neutral-800 border-neutral-700 shadow-lg' : 'bg-white border-slate-100 shadow-sm');

  if (isMinimized) {
    return (
      <div 
        onClick={() => onToggleExpand(c.id)}
        className={`px-4 py-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:shadow-md ${cardBg}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'implemented' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className={`text-[9px] font-black uppercase tracking-tighter ${c.status === 'implemented' ? 'text-emerald-600' : 'text-red-400 line-through'}`}>
            {c.status === 'implemented' ? 'Approved' : 'Rejected'}
          </span>
          <span className={`text-[10px] font-bold truncate max-w-[120px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>"{c.content}"</span>
        </div>
        <ChevronDown size={14} className={isDark ? 'text-neutral-500' : 'text-slate-300'} />
      </div>
    );
  }

  return (
    <div className={`space-y-3 p-4 rounded-2xl border transition-all ${cardBg}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded shadow-sm flex-shrink-0" style={{ backgroundColor: flower?.color || '#ccc' }} />
          <span className={`text-[10px] font-black ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{c.author}</span>
          {isAuthor && (c.status === 'resolved' || c.status === 'implemented') && (
            <button onClick={() => onToggleExpand(c.id)} className={`ml-auto ${isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-slate-300 hover:text-slate-500'}`}><ChevronUp size={14}/></button>
          )}
        </div>
        <div className="flex gap-1">
          {c.status !== 'open' && (
            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${c.status === 'implemented' ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
              {c.status === 'implemented' ? 'Approved' : 'Rejected'}
            </span>
          )}
          {c.rating && <span className="text-[7px] font-black bg-amber-100 text-amber-600 uppercase px-1.5 py-0.5 rounded-full">{c.rating}</span>}
        </div>
      </div>

      <div className={`text-sm font-bold leading-relaxed ${c.status === 'resolved' ? (isDark ? 'text-neutral-500 line-through' : 'text-slate-400 line-through') : (isDark ? 'text-neutral-200' : 'text-slate-700')}`}>
        {c.textSelection && (
          <p className={`text-[9px] font-black mb-1 border-b pb-1 italic line-clamp-1 ${c.status === 'implemented' ? (isDark ? 'text-emerald-400 border-emerald-700' : 'text-emerald-600 border-emerald-100') : (isDark ? 'text-neutral-400 border-neutral-700' : 'text-slate-400 border-slate-100')}`}>
            ON: "{c.textSelection}"
          </p>
        )}
        {c.content}
      </div>

      {isAuthor && c.status === 'open' && (
        <div className={`flex items-center gap-2 pt-2 border-t ${isDark ? 'border-neutral-700' : 'border-slate-50'}`}>
          <button onClick={() => onStatusUpdate(c.id, 'implemented')} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-neutral-700 hover:bg-emerald-900/50 hover:text-emerald-400' : 'bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600'}`} title="Approve/Implemented"><ThumbsUp size={13} /></button>
          <button onClick={() => onStatusUpdate(c.id, 'resolved')} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-neutral-700 hover:bg-red-900/50 hover:text-red-400' : 'bg-slate-50 hover:bg-red-50 hover:text-red-600'}`} title="Reject/Resolved"><Frown size={13} /></button>
          <div className={`w-px h-4 mx-1 ${isDark ? 'bg-neutral-700' : 'bg-slate-100'}`} />
          <button onClick={() => onRateComment(c.id, 'useful')} className={`p-1.5 text-[8px] font-black uppercase transition-colors flex items-center gap-1 ${isDark ? 'text-neutral-400 hover:text-indigo-400' : 'text-slate-400 hover:text-indigo-600'}`}>HELPFUL</button>
          <button onClick={() => onRateComment(c.id, 'irrelevant')} className={`p-1.5 text-[8px] font-black uppercase transition-colors flex items-center gap-1 ${isDark ? 'text-neutral-400 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}>SKIP</button>
        </div>
      )}

      <div className={`pl-3 border-l-2 space-y-3 mt-4 ${isDark ? 'border-neutral-700' : 'border-slate-100'}`}>
        {c.replies.map(r => (
          <div key={r.id} className={`text-[10px] font-bold ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}><span className={`font-black ${isDark ? 'text-neutral-200' : 'text-slate-900'}`}>{r.author}:</span> {r.content}</div>
        ))}
        <div className="flex gap-2">
          <input 
            value={replyText[c.id] || ''} 
            onChange={(e) => onReplyTextChange(c.id, e.target.value)} 
            placeholder="Reply..." 
            className={`flex-grow text-[10px] font-bold p-2 rounded-lg outline-none ${isDark ? 'bg-neutral-700 text-neutral-200 placeholder:text-neutral-500' : 'bg-slate-50 text-slate-800 placeholder:text-slate-400'}`} 
            title="Reply to comment"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onReply(c.id);
              }
            }}
          />
          <button onClick={() => onReply(c.id)} className="text-indigo-500 p-1 hover:scale-110 transition-transform"><Send size={12}/></button>
        </div>
      </div>
    </div>
  );
};

export function CritiqueSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [_loading, setLoading] = useState(true);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [globalThoughts, setGlobalThoughts] = useState({ worked: '', didntWork: '' });
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState<FlowerIdentity | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true); // Default to unlocked for now
  const [showIdentitySelector, setShowIdentitySelector] = useState(false);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);
  
  // New: Font size state for readers
  const [fontSize, setFontSize] = useState(20);
  
  // Author controls state
  const [isExtending, setIsExtending] = useState(false);
  const [showAuthorPanel, setShowAuthorPanel] = useState(false);
  const [extensionCount, setExtensionCount] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showIdentityBanner, setShowIdentityBanner] = useState(true);

  const paragraphs = useMemo(() => session?.content.split('\n').filter(p => p.trim() !== '') || [], [session?.content]);
  const panelRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Theme-aware class variables (available for component use)
  // Use transparent backgrounds to let the dynamic background from CritiqueRoomRoute show through
  const isDark = theme === 'dark';
  const pageBg = ''; // Transparent - lets the route's dynamic background show
  const headerBg = isDark ? 'bg-neutral-900/95 border-neutral-800' : 'bg-white/95 border-slate-200';
  const textPrimary = isDark ? 'text-neutral-100' : 'text-slate-900';
  const _textSecondary = isDark ? 'text-neutral-300' : 'text-slate-700';
  const textMuted = isDark ? 'text-neutral-400' : 'text-slate-400';
  const _textDimmed = isDark ? 'text-neutral-500' : 'text-slate-500';
  const _cardBg = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200';
  const _cardBgSoft = isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50/80 border-slate-100';
  const _articleBg = isDark ? 'bg-neutral-900 border-neutral-700/50' : 'bg-white border-slate-200/40';
  const _inputBg = isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400';
  const _inputFocus = isDark ? 'focus:bg-neutral-700 focus:border-indigo-500' : 'focus:bg-white focus:border-indigo-200';
  const _buttonBg = isDark ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-white border-slate-200 hover:bg-slate-50';
  const _dividerColor = isDark ? 'border-neutral-700' : 'border-slate-100';
  const _shadowColor = isDark ? 'shadow-neutral-950/50' : 'shadow-slate-200/60';
  
  // Suppress unused variable warnings - these are available for future use
  void(_textSecondary); void(_textDimmed); void(_cardBg); void(_cardBgSoft); 
  void(_articleBg); void(_inputBg); void(_inputFocus); void(_buttonBg);
  void(_dividerColor); void(_shadowColor);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      
      setLoading(true);
      try {
        const loadedSession = await critiqueRoomAPI.sessions.get(sessionId);
        setSession(loadedSession);
        setIsAuthor(loadedSession.isAuthor || isLocalAuthor(sessionId));
        
        // Handle password protection
        if (loadedSession.passwordProtected && !loadedSession.isAuthor) {
          setIsUnlocked(false);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        setSession(null);
      } finally {
        setLoading(false);
      }

      // Load identity - check Discord auth first, then localStorage
      try {
        const discordUser = await critiqueRoomAPI.auth.getCurrentUser();
        if (discordUser) {
          // User is logged in via Discord - use their Discord identity
          const discordIdentity: FlowerIdentity = {
            name: discordUser.username,
            color: '#5865F2',
            isDiscord: true
          };
          setIdentity(discordIdentity);
          saveSessionIdentity(sessionId, discordIdentity);
          setShowIdentityBanner(false); // Auto-hide if already logged in
        } else {
          // Not logged in via Discord - check localStorage or create new flower
          const savedIdentity = getSessionIdentity(sessionId);
          if (savedIdentity) {
            setIdentity(savedIdentity);
          } else {
            const randomFlower = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
            saveSessionIdentity(sessionId, randomFlower);
            setIdentity(randomFlower);
          }
        }
      } catch {
        // Discord auth check failed - use localStorage or new flower
        const savedIdentity = getSessionIdentity(sessionId);
        if (savedIdentity) {
          setIdentity(savedIdentity);
        } else {
          const randomFlower = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
          saveSessionIdentity(sessionId, randomFlower);
          setIdentity(randomFlower);
        }
      }

      // Load preferred font size
      setFontSize(getPreferredFontSize());
    }
    
    loadSession();
  }, [sessionId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(48, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem('critiqueroom_pref_fontsize', newSize.toString());
  };

  const handleTextSelection = useCallback((paraIdx: number) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (text.length > 0) {
      setActiveParagraph(paraIdx);
      setCurrentSelection({ start: range.startOffset, end: range.endOffset, text });
      setShowAllFeedback(false);
    }
  }, []);

  const handleParagraphClick = (idx: number) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setActiveParagraph(idx);
      setCurrentSelection(null);
      setShowAllFeedback(false);
    }
  };

  const handleAddComment = async () => {
    if (!session || !sessionId || activeParagraph === null || !newComment.trim() || !identity) return;
    
    try {
      const result = await critiqueRoomAPI.comments.create({
        sessionId,
        paragraphIndex: activeParagraph,
        startOffset: currentSelection?.start,
        endOffset: currentSelection?.end,
        textSelection: currentSelection?.text,
        content: newComment,
        authorName: identity.name,
      });
      
      const comment: Comment = {
        id: result.id,
        paragraphIndex: activeParagraph,
        startOffset: currentSelection?.start,
        endOffset: currentSelection?.end,
        textSelection: currentSelection?.text,
        content: newComment,
        author: identity.name,
        timestamp: result.timestamp,
        status: 'open',
        replies: []
      };
      
      setSession({ ...session, comments: [...session.comments, comment] });
      setNewComment('');
      setCurrentSelection(null);
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleSubmitGlobalFeedback = () => {
    if (!session || !identity || (!globalThoughts.worked.trim() && !globalThoughts.didntWork.trim())) return;
    
    setIsSubmittingGlobal(true);
    const newGlobal: GlobalFeedback[] = [];
    
    if (globalThoughts.worked.trim()) {
      newGlobal.push({
        category: 'worked',
        text: globalThoughts.worked.trim(),
        author: identity.name,
        timestamp: Date.now()
      });
    }
    
    if (globalThoughts.didntWork.trim()) {
      newGlobal.push({
        category: 'didnt-work',
        text: globalThoughts.didntWork.trim(),
        author: identity.name,
        timestamp: Date.now()
      });
    }

    const updated = { 
      ...session, 
      globalFeedback: [...session.globalFeedback, ...newGlobal] 
    };
    
    setSession(updated);
    // TODO: API call for global feedback
    critiqueRoomAPI.feedback.create({
      sessionId: sessionId!,
      category: 'overall',
      text: globalThoughts.worked.trim() + '\n\n' + globalThoughts.didntWork.trim(),
      authorName: identity.name,
    }).catch(console.error);
    
    setGlobalThoughts({ worked: '', didntWork: '' });
    
    setTimeout(() => {
      setIsSubmittingGlobal(false);
      alert("Overall thoughts submitted! Thank you.");
    }, 600);
  };

  const handleReply = async (commentId: string) => {
    const text = replyText[commentId];
    if (!session || !text?.trim() || !identity) return;
    
    try {
      const result = await critiqueRoomAPI.comments.reply(commentId, text, identity.name);
      const updatedComments = session.comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...c.replies, { id: result.id, author: identity.name, content: text, timestamp: result.timestamp }]
          };
        }
        return c;
      });
      setSession({ ...session, comments: updatedComments });
      setReplyText({ ...replyText, [commentId]: '' });
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const handleStatusUpdate = async (commentId: string, status: Comment['status']) => {
    if (!session || !sessionId || !isAuthor) return;
    try {
      await critiqueRoomAPI.comments.updateStatus(commentId, { status }, sessionId);
      const updatedComments = session.comments.map(c => c.id === commentId ? { ...c, status } : c);
      setSession({ ...session, comments: updatedComments });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update comment status. Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleRateComment = async (commentId: string, rating: Comment['rating']) => {
    if (!session || !sessionId || !isAuthor) return;
    try {
      await critiqueRoomAPI.comments.updateStatus(commentId, { rating }, sessionId);
      const updatedComments = session.comments.map(c => c.id === commentId ? { ...c, rating } : c);
      setSession({ ...session, comments: updatedComments });
    } catch (err) {
      console.error('Failed to rate comment:', err);
      alert('Failed to rate comment. Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !sessionId) return;
    
    try {
      // Try to get session with password
      const unlockedSession = await critiqueRoomAPI.sessions.get(sessionId, passwordInput);
      setSession(unlockedSession);
      setIsUnlocked(true);
    } catch {
      alert("Incorrect password.");
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedComments(newExpanded);
  };

  const connectDiscord = async () => {
    // First check if already logged in via Discord
    try {
      const user = await critiqueRoomAPI.auth.getCurrentUser();
      if (user) {
        // User is already logged in - use their Discord info
        const discordIdentity: FlowerIdentity = {
          name: user.username,
          color: '#5865F2',
          isDiscord: true
        };
        setIdentity(discordIdentity);
        if (sessionId) {
          localStorage.setItem(`critiqueroom_identity_${sessionId}`, JSON.stringify(discordIdentity));
        }
        setShowIdentitySelector(false);
        setShowIdentityBanner(false);
      } else {
        // Need to login - redirect to Discord OAuth
        // Store current session URL to return to after auth
        critiqueRoomAPI.auth.loginWithDiscord(window.location.href);
      }
    } catch (err) {
      console.error('Discord auth error:', err);
      // Fallback: redirect to Discord login
      critiqueRoomAPI.auth.loginWithDiscord(window.location.href);
    }
  };

  const resetIdentity = () => {
    const randomFlower = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    setIdentity(randomFlower);
    if (sessionId) {
      localStorage.setItem(`critiqueroom_identity_${sessionId}`, JSON.stringify(randomFlower));
    }
    setShowIdentitySelector(false);
  };

  const getFontClass = (combo: FontCombo) => {
    if (combo === 'LITERARY') return 'font-source-serif';
    if (combo === 'MODERN') return 'font-literata';
    if (combo === 'PAPERBACK') return 'font-merriweather';
    return 'serif-font';
  };

  const typingHints = useMemo(() => {
    if (!session) return [];
    const hints = [];
    if (session.modes.includes(FeedbackMode.CHARACTER_VOICE)) hints.push("Is this character-consistent?");
    if (session.modes.includes(FeedbackMode.BIG_PICTURE)) hints.push("Does this scene drag or feel rushed?");
    if (session.modes.includes(FeedbackMode.WORLDBUILDING)) hints.push("Is the setting clear enough?");
    return hints;
  }, [session]);

  const handleCopyId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExtendSession = async () => {
    if (!sessionId || !session || isExtending) return;
    
    // Check if session has no expiration
    if (!session.expiresAt) {
      alert('This session never expires, so it cannot be extended.');
      return;
    }

    // Check if already at max extensions
    if (extensionCount >= 3) {
      alert('Maximum extensions reached (3/3). Cannot extend further.');
      return;
    }

    setIsExtending(true);
    try {
      const result = await critiqueRoomAPI.sessions.extend(sessionId);
      setSession({
        ...session,
        expiresAt: result.newExpiresAt,
      });
      setExtensionCount(result.extensionCount);
      alert(`Session extended! New expiration: ${new Date(result.newExpiresAt).toLocaleDateString()}. ${result.extensionsRemaining} extensions remaining.`);
    } catch (err) {
      console.error('Failed to extend session:', err);
      alert(err instanceof Error ? err.message : 'Failed to extend session');
    } finally {
      setIsExtending(false);
    }
  };

  const formatExpiration = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = timestamp - now;
    
    if (diff < 0) return 'Expired';
    if (diff < 24 * 60 * 60 * 1000) return 'Less than 24h';
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return `${days} day${days > 1 ? 's' : ''} left`;
  };

  // Memoized callback handlers for CommentCard - MUST be before any early returns
  const handleReplyTextChange = useCallback((commentId: string, text: string) => {
    setReplyText(prev => ({ ...prev, [commentId]: text }));
  }, []);

  // Show loading state while fetching session
  if (_loading) return (
    <div className="max-w-2xl mx-auto py-32 text-center">
      <Loader2 className="w-16 h-16 mx-auto mb-6 text-indigo-400 animate-spin" />
      <h1 className="text-xl font-bold text-slate-400">Loading session...</h1>
    </div>
  );

  if (!session) return (
    <div className="max-w-2xl mx-auto py-32 text-center">
      <Clock className="w-16 h-16 mx-auto mb-6 text-slate-200" />
      <h1 className="text-3xl font-black tracking-tight">Session Not Found</h1>
      <Link to="/critiqueroom" className="mt-8 inline-block bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold">Return Home</Link>
    </div>
  );

  if (!isUnlocked) return (
    <div className="max-w-md mx-auto py-32 px-6">
      <div className="bg-white rounded-[2.5rem] p-12 border shadow-2xl space-y-8 text-center">
        <Lock size={32} className="mx-auto text-indigo-500" />
        <h1 className="text-2xl font-black">Locked Session</h1>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Enter Password" title="Session Password" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border font-bold text-center outline-none" />
          <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700">Unlock Room</button>
        </form>
      </div>
    </div>
  );

  const displayedComments = showAllFeedback ? session.comments : session.comments.filter(c => c.paragraphIndex === activeParagraph);

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <PageNavbar breadcrumbs={[
        { label: 'Critique Room', path: '/critiqueroom' },
        { label: session.title || 'Session' }
      ]} />
      <header className={`${headerBg} backdrop-blur-md sticky top-0 z-40 border-b py-4 px-6`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 overflow-hidden">
            <Link to="/critiqueroom" className={`${textMuted} hover:text-indigo-500 transition-colors flex-shrink-0`}>
              <ChevronLeft size={20} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className={`text-xl font-black truncate ${textPrimary} ${getFontClass(session.fontCombo)}`}>{session.title}</h1>
                {/* Session ID Badge - for sharing */}
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  title="Click to copy Session ID"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {sessionId}
                </button>
                <div className="hidden sm:flex gap-1 overflow-x-auto no-scrollbar">
                  {session.modes.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-full border border-indigo-100 whitespace-nowrap">{m}</span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-0.5">MANUSCRIPT BY {session.authorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Font Size Controls */}
            <div className={`flex items-center border rounded-xl px-1.5 py-1 gap-1 shadow-sm mr-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-slate-200'}`}>
              <button onClick={() => adjustFontSize(-2)} className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-neutral-300 hover:text-indigo-400 hover:bg-neutral-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`} title="Decrease font size">
                <Minus size={14} />
              </button>
              <div className="px-2 flex flex-col items-center">
                <Type size={12} className={isDark ? 'text-neutral-500' : 'text-slate-300'} />
                <span className={`text-[9px] font-black tabular-nums ${isDark ? 'text-neutral-300' : 'text-slate-400'}`}>{fontSize}</span>
              </div>
              <button onClick={() => adjustFontSize(2)} className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-neutral-300 hover:text-indigo-400 hover:bg-neutral-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`} title="Increase font size">
                <Plus size={14} />
              </button>
            </div>

            <button 
              onClick={() => { setShowAllFeedback(!showAllFeedback); setActiveParagraph(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${showAllFeedback ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : (isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-indigo-500 hover:text-indigo-400' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600')}`}
            >
              <Layers size={14} /> {showAllFeedback ? 'Contextual Mode' : 'Show All Feedback'}
            </button>
            {/* Export button - author only */}
            {isAuthor && (
              <button 
                onClick={() => setShowExportModal(true)} 
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition-colors text-[10px] font-black uppercase ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`} 
                title="Export Feedback"
              >
                <Download size={16} /> Export
              </button>
            )}
            <button onClick={handleCopyLink} className={`p-2.5 border rounded-xl transition-colors ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{copied ? <Check size={18} /> : <Copy size={18} />}</button>
            
            {/* Author Controls */}
            {isAuthor && (
              <div className="relative">
                <button 
                  onClick={() => setShowAuthorPanel(!showAuthorPanel)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${showAuthorPanel ? 'bg-amber-600 text-white border-amber-600' : (isDark ? 'bg-amber-900/60 text-amber-300 border-amber-700 hover:border-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400')}`}
                >
                  <Settings size={14} /> Author Tools
                </button>
                
                {/* Author Panel Dropdown */}
                {showAuthorPanel && (
                  <div className="absolute right-0 top-12 w-72 bg-white border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400">Session Expiration</span>
                        <span className="text-xs font-bold text-slate-600">{formatExpiration(session.expiresAt ?? null)}</span>
                      </div>
                      
                      {session.expiresAt && (
                        <button
                          onClick={handleExtendSession}
                          disabled={isExtending || extensionCount >= 3}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                        >
                          {isExtending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CalendarPlus size={16} />
                          )}
                          Extend +7 Days ({3 - extensionCount} left)
                        </button>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">Stats</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <div className="text-xl font-black text-indigo-600">{session.comments.length}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">Comments</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <div className="text-xl font-black text-emerald-600">{session.globalFeedback?.length || 0}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase">Overall Feedback</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100">
                      <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] font-medium text-amber-700 leading-tight">
                          Remember to export your feedback before the session expires!
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Identity Banner - for critiquers to identify themselves */}
      {showIdentityBanner && !isAuthor && (
        <div className={`border-b ${isDark ? 'bg-indigo-950/50 border-indigo-900' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: identity?.color }}
                >
                  {identity?.isDiscord ? <User size={18} /> : <Flower2 size={18} />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                    Providing feedback as <span className="font-black">{identity?.name}</span>
                  </p>
                  <p className={`text-[10px] font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                    {identity?.isDiscord ? 'Linked with Discord' : 'Anonymous flower identity'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!identity?.isDiscord && (
                  <button
                    onClick={connectDiscord}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <svg width="16" height="12" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3## 44.2785 53.4804 44.2898 53.5475 44.3433C53.9029 44.6363 54.2751 44.9293 54.6501 45.2082C54.7788 45.304 54.7676 45.5041 54.6277 45.5858C52.859 46.6197 51.0203 47.4931 49.0893 48.2256C48.9634 48.2735 48.9046 48.4172 48.9662 48.5383C50.0213 50.6035 51.2387 52.57 52.5926 54.435C52.6514 54.5139 52.7465 54.5477 52.8417 54.5195C58.6426 52.7249 64.5253 50.0174 70.5982 45.5576C70.6513 45.5182 70.6877 45.459 70.6933 45.3942C72.1932 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" fill="currentColor"/>
                    </svg>
                    Use Discord Profile
                  </button>
                )}
                <button
                  onClick={resetIdentity}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}
                >
                  <Flower2 size={14} />
                  {identity?.isDiscord ? 'Go Anonymous' : 'New Flower'}
                </button>
                <button
                  onClick={() => setShowIdentityBanner(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-white text-slate-400'}`}
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 relative">
        <main className="lg:col-span-8 py-12 px-6">
          <article className={`max-w-[760px] mx-auto rounded-xl paper-shadow px-10 md:px-20 py-24 min-h-[1200px] border relative ${isDark ? 'bg-neutral-900 border-neutral-700/50' : 'bg-white border-slate-200/40'}`}>
             <div className="text-center mb-32 space-y-4">
              <h1 className={`text-5xl font-black tracking-tight ${textPrimary} ${getFontClass(session.fontCombo)}`}>{session.title}</h1>
              <div className={`w-12 h-1 mx-auto rounded-full ${isDark ? 'bg-indigo-500/50' : 'bg-indigo-100'}`} />
            </div>

            <div 
              className={`selection:bg-indigo-100 selection:text-indigo-900 ${getFontClass(session.fontCombo)} leading-[1.75] ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {paragraphs.map((p, idx) => {
                const isActive = activeParagraph === idx;
                const section = session.sections.find(s => s.paragraphIndex === idx);
                const paraComments = session.comments.filter(c => c.paragraphIndex === idx);
                const commentCount = paraComments.length;
                
                // Render markdown to HTML (inline only for paragraphs)
                const renderedHtml = DOMPurify.sanitize(marked.parseInline(p) as string);
                
                // Dynamic highlight color based on comment count (dark mode aware)
                const getHighlightClass = () => {
                  if (isActive) {
                    return isDark 
                      ? 'bg-indigo-900/50 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-900/30' 
                      : 'bg-indigo-100 ring-2 ring-indigo-300 shadow-sm';
                  }
                  if (commentCount === 0) {
                    return isDark ? 'hover:bg-neutral-800/60' : 'hover:bg-slate-100/80';
                  }
                  if (commentCount <= 2) {
                    return isDark 
                      ? 'bg-amber-900/20 hover:bg-amber-800/30 border-l-2 border-amber-600'
                      : 'bg-amber-50/50 hover:bg-amber-100/70 border-l-2 border-amber-300';
                  }
                  if (commentCount <= 5) {
                    return isDark
                      ? 'bg-orange-900/25 hover:bg-orange-800/35 border-l-3 border-orange-500'
                      : 'bg-orange-50/60 hover:bg-orange-100/80 border-l-3 border-orange-400';
                  }
                  return isDark
                    ? 'bg-rose-900/30 hover:bg-rose-800/40 border-l-4 border-rose-500'
                    : 'bg-rose-50/70 hover:bg-rose-100/90 border-l-4 border-rose-500';
                };
                
                return (
                  <div key={idx} id={`para-${idx}`} className="relative mb-10 group">
                    {section && <div className="absolute -top-6 left-0 text-[10px] font-black text-indigo-300 uppercase tracking-widest">{section.label}</div>}
                    
                    {/* Comment count badge - visible when paragraph has comments */}
                    {commentCount > 0 && (
                      <div 
                        className={`absolute -left-12 top-1 flex items-center gap-1 cursor-pointer transition-all hover:scale-110 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`}
                        onClick={() => handleParagraphClick(idx)}
                        title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
                      >
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-white text-[10px] font-black shadow-md ${
                          commentCount <= 2 ? 'bg-amber-500' : 
                          commentCount <= 5 ? 'bg-orange-500' : 
                          'bg-rose-500'
                        }`}>
                          {commentCount}
                        </div>
                        <MessageSquare size={12} className={`${
                          commentCount <= 2 ? 'text-amber-400' : 
                          commentCount <= 5 ? 'text-orange-400' : 
                          'text-rose-400'
                        }`} />
                      </div>
                    )}
                    
                    <p 
                      onMouseUp={() => handleTextSelection(idx)} 
                      onClick={() => handleParagraphClick(idx)} 
                      className={`relative cursor-text transition-all duration-200 px-4 -mx-4 rounded-xl whitespace-pre-wrap prose-formatting ${getHighlightClass()}`}
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                    
                    {/* Inline margin comments - show when paragraph has comments and is active or expanded */}
                    {commentCount > 0 && (isActive || showAllFeedback) && (
                      <div className={`mt-4 pl-4 border-l-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'border-indigo-500/50' : 'border-indigo-200'}`}>
                        {paraComments.slice(0, 3).map((c) => {
                          const flower = FLOWERS.find(f => f.name === c.author) || { color: '#6366f1' };
                          return (
                            <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border hover:shadow-sm transition-all ${isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-slate-50/80 border-slate-100'}`}>
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-black flex-shrink-0"
                                style={{ backgroundColor: flower.color }}
                              >
                                {c.author.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-black ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>{c.author}</span>
                                  {c.status !== 'open' && (
                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${c.status === 'implemented' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                      {c.status === 'implemented' ? '✓' : '✗'}
                                    </span>
                                  )}
                                </div>
                                {c.textSelection && (
                                  <p className={`text-[9px] font-medium italic mb-1 line-clamp-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>"{c.textSelection}"</p>
                                )}
                                <p className={`text-[11px] font-medium leading-relaxed line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>{c.content}</p>
                              </div>
                            </div>
                          );
                        })}
                        {commentCount > 3 && (
                          <button 
                            onClick={() => handleParagraphClick(idx)}
                            className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 pl-9"
                          >
                            +{commentCount - 3} more comment{commentCount - 3 > 1 ? 's' : ''} →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>

          <section className={`max-w-[760px] mx-auto mt-12 border rounded-[2rem] p-12 shadow-sm space-y-10 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-slate-200'}`}>
            <div className="space-y-2">
              <h2 className={`text-2xl font-black ${textPrimary}`}>Overall Feedback</h2>
              <p className={`text-sm font-medium ${textMuted}`}>Capture your big-picture thoughts for the author here.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <textarea value={globalThoughts.worked} onChange={(e) => setGlobalThoughts({...globalThoughts, worked: e.target.value})} className={`w-full p-6 rounded-2xl border text-sm font-bold min-h-[180px] outline-none ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:bg-neutral-700' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:bg-white'}`} placeholder="What resonated most?" />
              <textarea value={globalThoughts.didntWork} onChange={(e) => setGlobalThoughts({...globalThoughts, didntWork: e.target.value})} className={`w-full p-6 rounded-2xl border text-sm font-bold min-h-[180px] outline-none ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:bg-neutral-700' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:bg-white'}`} placeholder="What felt confusing or slow?" />
            </div>
            <div className={`flex justify-between items-center pt-8 border-t ${isDark ? 'border-neutral-700' : 'border-slate-100'}`}>
               <div className="flex items-center gap-3">
                  <div className="relative">
                    <button onClick={() => setShowIdentitySelector(!showIdentitySelector)} className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform" style={{ backgroundColor: identity?.color }}>
                      {identity?.isDiscord ? <User size={20} /> : <Flower2 size={20} />}
                    </button>
                    {showIdentitySelector && (
                      <div className="absolute bottom-12 left-0 w-48 bg-white border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                        <button onClick={connectDiscord} className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-colors">
                          <div className="w-6 h-6 rounded bg-[#5865F2] flex items-center justify-center text-white"><User size={12}/></div>
                          <div className="text-left">
                            <div className="text-[10px] font-black">Use Discord</div>
                            <div className="text-[8px] text-slate-400">Identify as Editor</div>
                          </div>
                        </button>
                        <button onClick={resetIdentity} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className="w-6 h-6 rounded bg-emerald-400 flex items-center justify-center text-white"><Flower2 size={12}/></div>
                          <div className="text-left">
                            <div className="text-[10px] font-black">Stay Anonymous</div>
                            <div className="text-[8px] text-slate-400">Random Flower</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700">{identity?.name}</span>
                    <button onClick={() => setShowIdentitySelector(!showIdentitySelector)} className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 text-left">Switch Identity</button>
                  </div>
               </div>
               <button
                onClick={handleSubmitGlobalFeedback}
                disabled={isSubmittingGlobal || (!globalThoughts.worked.trim() && !globalThoughts.didntWork.trim())}
                className="bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
               >
                 {isSubmittingGlobal ? "Sending..." : "Submit Critique"}
               </button>
            </div>
          </section>

          {/* Overall Feedback Display - Like Blog Comments */}
          {session.globalFeedback && session.globalFeedback.length > 0 && (
            <section className={`max-w-[760px] mx-auto mt-8 border rounded-[2rem] p-12 shadow-sm space-y-8 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-slate-200'}`}>
              <div className="space-y-2">
                <h2 className={`text-xl font-black flex items-center gap-3 ${textPrimary}`}>
                  <MessageSquare size={20} className="text-indigo-500" />
                  Submitted Feedback ({session.globalFeedback.length})
                </h2>
                <p className={`text-sm font-medium ${textMuted}`}>Big-picture thoughts from your readers.</p>
              </div>
              
              <div className="space-y-6">
                {session.globalFeedback.map((fb, idx) => {
                  const flower = FLOWERS.find(f => f.name === fb.author) || { color: '#6366f1' };
                  const categoryLabel = fb.category === 'worked' ? 'What Worked' : 
                                        fb.category === 'didnt-work' ? "What Didn't Work" : 
                                        fb.category === 'confusing' ? 'Confusing Parts' : 'Overall Thoughts';
                  const categoryColor = fb.category === 'worked' 
                    ? (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                    : fb.category === 'didnt-work' 
                    ? (isDark ? 'bg-red-900/30 text-red-400 border-red-700' : 'bg-red-50 text-red-700 border-red-200')
                    : fb.category === 'confusing' 
                    ? (isDark ? 'bg-amber-900/30 text-amber-400 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200')
                    : (isDark ? 'bg-indigo-900/30 text-indigo-400 border-indigo-700' : 'bg-indigo-50 text-indigo-700 border-indigo-200');
                  
                  return (
                    <div key={idx} className={`rounded-2xl p-6 border space-y-4 hover:shadow-md transition-shadow ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50/50 border-slate-100'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: flower.color }}
                          >
                            <Flower2 size={16} />
                          </div>
                          <div>
                            <span className={`text-sm font-black ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{fb.author}</span>
                            <span className={`text-[10px] block ${textMuted}`}>
                              {new Date(fb.timestamp).toLocaleDateString()} at {new Date(fb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${categoryColor}`}>
                          {categoryLabel}
                        </span>
                      </div>
                      <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                        {fb.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <div className="hidden lg:block w-px bg-slate-200/60 absolute left-[66.666%] top-12 bottom-12" />

        <aside className="lg:col-span-4 py-12 px-8">
          <div ref={panelRef} className={`sticky top-28 space-y-4 transition-all duration-300 ${activeParagraph !== null || showAllFeedback ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-80'}`}>
            {activeParagraph !== null || showAllFeedback ? (
              <div className={`border rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-right-4 duration-300 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-slate-200'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>
                    {showAllFeedback ? 'All Feedback' : (currentSelection ? 'PRECISION LINE COMMENT' : 'PARAGRAPH DISCUSSION')}
                  </span>
                  <button onClick={() => { setActiveParagraph(null); setCurrentSelection(null); setShowAllFeedback(false); }} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={18} /></button>
                </div>

                <div className={`p-4 space-y-4 max-h-[55vh] overflow-y-auto hide-scrollbar ${displayedComments.length === 0 ? 'pb-2' : ''}`}>
                  {!showAllFeedback && currentSelection && (
                    <div className={`p-4 rounded-xl border text-xs italic font-bold leading-relaxed shadow-sm ${isDark ? 'bg-indigo-900/30 border-indigo-700/50 text-indigo-200' : 'bg-indigo-50/50 border-indigo-100/50 text-indigo-900'}`}>"{currentSelection.text}"</div>
                  )}

                  {displayedComments.length > 0 ? (
                    displayedComments.map(c => (
                      <CommentCard 
                        key={c.id} 
                        comment={c}
                        isAuthor={isAuthor}
                        isDark={isDark}
                        expandedComments={expandedComments}
                        replyText={replyText}
                        onToggleExpand={toggleExpand}
                        onStatusUpdate={handleStatusUpdate}
                        onRateComment={handleRateComment}
                        onReply={handleReply}
                        onReplyTextChange={handleReplyTextChange}
                      />
                    ))
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <MessageSquare className={`mx-auto ${isDark ? 'text-neutral-600' : 'text-slate-200'}`} size={32} />
                      <p className={`text-xs font-bold ${textMuted}`}>No feedback here yet.</p>
                    </div>
                  )}
                </div>

                {!showAllFeedback && (
                  <div className="p-4 pt-1 space-y-3">
                    {newComment.length === 0 && typingHints.length > 0 && (
                      <div className={`p-2.5 rounded-xl space-y-0.5 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50/50'}`}>
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-400"><Lightbulb size={10}/> GUIDED CRITIQUE</div>
                        {typingHints.map((h, i) => <p key={i} className={`text-[10px] font-bold leading-tight select-none cursor-default ${isDark ? 'text-indigo-300/60' : 'text-indigo-900/60'}`}>• {h}</p>)}
                      </div>
                    )}
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={currentSelection ? "What do you suggest here?" : "General thoughts on this paragraph?"} className={`w-full p-4 text-sm font-bold rounded-xl border outline-none h-24 resize-none transition-all ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:bg-neutral-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-200'}`} />
                    <div className="flex gap-2">
                      <button onClick={handleAddComment} disabled={!newComment.trim()} className="flex-grow bg-indigo-600 text-white py-3.5 rounded-xl font-black text-sm flex justify-center gap-2 items-center hover:bg-indigo-700 shadow-xl disabled:opacity-50 transition-all"><Send size={16}/> POST CRITIQUE</button>
                      <button onClick={() => setShowIdentitySelector(true)} className={`p-3 rounded-xl transition-all ${isDark ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="Identify yourself"><User size={20} /></button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center space-y-6 shadow-sm ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-slate-200'}`}>
                <MessageSquare size={32} className={`mx-auto ${isDark ? 'text-neutral-600' : 'text-slate-300'}`} />
                <p className={`text-xs font-black uppercase px-4 leading-relaxed ${textMuted}`}>Highlight text to provide focused feedback on specific words or phrases</p>
                <div className={`p-4 rounded-2xl text-[9px] font-bold leading-relaxed border ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <div className="flex items-center gap-2 mb-2 font-black"><Clock size={10}/> DATA RETENTION</div>
                  This session is temporary. Authors must export their feedback before the session expires.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200">
        <SocialIcons variant="footer" showCopyright={true} />
      </footer>

      {/* Export Modal - for authors to print/copy feedback */}
      <FeedbackExportModal
        session={session}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}

export default CritiqueSession;
