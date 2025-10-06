import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getChapterLikeStatus, likeChapter, getChapterComments, addComment, getChapterDetails, getStory } from '../utils/api-story';

interface StoryComment {
  id: number;
  author_name: string;
  comment_text: string;
  created_at: string;
}

interface CommentsSectionProps {
  storyId: string;
  chapterId: number;
}

export function CommentsSection({ storyId, chapterId }: CommentsSectionProps) {
  const { theme } = useTheme();
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [likes, setLikes] = useState({ count: 0, userLiked: false });
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [chapterPk, setChapterPk] = useState<number | null>(null);

  // Resolve the database primary key for this chapter (route gives chapter number)
  useEffect(() => {
    let cancelled = false;
    async function resolveChapterPk() {
      setLoading(true);
      try {
        const story = await getStory(storyId);
        if (story && !cancelled) {
          const details = await getChapterDetails(story, chapterId.toString());
          if (!cancelled) {
            setChapterPk(details && details.id !== undefined ? details.id : null);
          }
        } else if (!cancelled) {
          setChapterPk(null);
        }
      } catch {
        if (!cancelled) setChapterPk(null);
      }
    }
    resolveChapterPk();
    return () => { cancelled = true; };
  }, [storyId, chapterId]);

  // Load likes/comments after we know the chapter primary key
  useEffect(() => {
    if (!chapterPk) return;
    loadComments();
    loadLikes();
  }, [chapterPk]);

  const loadComments = async () => {
    if (!chapterPk) return;
    try {
      const list = await getChapterComments(chapterPk);
      setComments(Array.isArray(list) ? list as unknown as StoryComment[] : []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikes = async () => {
    if (!chapterPk) return;
    try {
      const data = await getChapterLikeStatus(chapterPk);
      if (data.like_count !== undefined) {
        setLikes({ count: data.like_count, userLiked: data.user_liked });
      }
    } catch (error) {
      console.error('Failed to load likes:', error);
    }
  };

  const handleLike = async () => {
    if (!chapterPk) return;
    try {
      const data = await likeChapter(chapterPk);
      if (data.success) {
        setLikes({ count: data.like_count, userLiked: data.user_liked });
      }
    } catch (error) {
      console.error('Failed to process like:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !chapterPk) return;

    setSubmitting(true);
    setMessage('');

    try {
      const data = await addComment(chapterPk, authorName.trim() || 'Anonymous', newComment.trim());
      
      if (data.success) {
        setMessage(data.message || 'Comment submitted successfully');
        setNewComment('');
        setAuthorName('');
        // Reload comments to show the new comment immediately
        loadComments();
      } else {
        setMessage(data.error || 'Failed to submit comment');
      }
    } catch (error) {
      setMessage('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass = theme === 'light' ? 'bg-white/70 border-gray-300' : 'bg-black/70 border-white/20'
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-white'
  const subtextClass = theme === 'light' ? 'text-gray-700' : 'text-neutral-300'

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div className={`${cardClass} rounded-xl p-6`}>
          <div className={subtextClass}>Loading comments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <div className={`${cardClass} rounded-xl p-6 border-t ${theme === 'light' ? 'border-gray-300' : 'border-white/20'}`}>
        {/* Like Button */}
        <div className="mb-8">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              likes.userLiked
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : theme === 'light'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-300 border border-white/20'
            }`}
          >
            <span className="text-lg">❤️</span>
            <span>{likes.count} {likes.count === 1 ? 'like' : 'likes'}</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h3 className={`text-xl font-bold mb-4 ${textClass}`}>
            Comments ({comments.length})
          </h3>

          {comments.length === 0 ? (
            <p className={`italic ${subtextClass}`}>No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className={`rounded-lg p-4 border ${
                  theme === 'light'
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-white/10 border-white/20'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-medium ${subtextClass}`}>{comment.author_name}</span>
                    <span className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-neutral-500'}`}>
                      {comment.created_at}
                    </span>
                  </div>
                  <p className={`whitespace-pre-wrap ${textClass}`}>{comment.comment_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Form */}
        <div className={`rounded-lg p-6 border ${
          theme === 'light'
            ? 'bg-gray-50 border-gray-300'
            : 'bg-white/10 border-white/20'
        }`}>
          <h4 className={`text-lg font-semibold mb-4 ${textClass}`}>Leave a Comment</h4>
        
          {message && (
            <div className={`mb-4 p-3 rounded border ${
              message.includes('successfully') 
                ? theme === 'light'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-green-900/50 text-green-200 border-green-700'
                : theme === 'light'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-red-900/50 text-red-200 border-red-700'
            }`}>
              {message}
            </div>
          )}

        <form onSubmit={handleSubmitComment} className="space-y-4">
          {/* Honeypot field - hidden from users, bots often fill it */}
          <input
            type="text"
            name="website"
            value=""
            onChange={() => {}}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />
          
            <div>
              <label htmlFor="authorName" className={`block text-sm font-medium mb-1 ${subtextClass}`}>
                Name (optional)
              </label>
              <input
                type="text"
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Anonymous"
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    : 'border-white/30 bg-white/10 text-neutral-200 placeholder-neutral-500'
                }`}
              />
            </div>

            <div>
              <label htmlFor="comment" className={`block text-sm font-medium mb-1 ${subtextClass}`}>
                Comment
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this chapter..."
                maxLength={1000}
                rows={4}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    : 'border-white/30 bg-white/10 text-neutral-200 placeholder-neutral-500'
                }`}
              />
              <div className={`text-right text-sm mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-neutral-500'}`}>
                {newComment.length}/1000 characters
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className={`w-full font-medium py-2 px-4 rounded-md transition-colors ${
                submitting || !newComment.trim()
                  ? theme === 'light'
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-neutral-700 cursor-not-allowed text-neutral-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Comment'}
            </button>
          </form>

          <p className={`text-sm mt-3 ${theme === 'light' ? 'text-gray-500' : 'text-neutral-500'}`}>
            Comments appear immediately. Please be respectful and follow community guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
