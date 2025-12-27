/**
 * FeedbackExportModal - Print-friendly modal for exporting critique session feedback
 * Allows authors to print, copy, or email their feedback summary
 * Theme-aware (dark mode support)
 */

import { useRef, useState } from 'react';
import { X, Printer, Copy, Check, MessageSquare, ThumbsUp, Frown, Clock, Mail, Loader2, Send } from 'lucide-react';
import { Session, Comment, FLOWERS } from '../types';
import { useTheme } from '../../storytime/contexts/ThemeContext';
import { critiqueRoomAPI } from '../utils/api-critiqueroom';

interface FeedbackExportModalProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackExportModal({ session, isOpen, onClose }: FeedbackExportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const paragraphs = session.content.split('\n').filter(p => p.trim() !== '');

  // Group comments by paragraph
  const commentsByParagraph: Record<number, Comment[]> = {};
  session.comments.forEach(c => {
    if (!commentsByParagraph[c.paragraphIndex]) {
      commentsByParagraph[c.paragraphIndex] = [];
    }
    commentsByParagraph[c.paragraphIndex].push(c);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = async () => {
    const textContent = generatePlainText();
    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);
    setEmailError('');

    try {
      await critiqueRoomAPI.sessions.exportEmail(session.id, email, generateHtmlForEmail());
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setShowEmailForm(false);
        setEmail('');
      }, 3000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const generatePlainText = (): string => {
    let text = `FEEDBACK REPORT\n`;
    text += `═══════════════════════════════════════\n`;
    text += `Title: ${session.title}\n`;
    text += `Author: ${session.authorName}\n`;
    text += `Exported: ${new Date().toLocaleDateString()}\n`;
    text += `Total Comments: ${session.comments.length}\n`;
    text += `═══════════════════════════════════════\n\n`;

    // Comments by paragraph
    Object.keys(commentsByParagraph)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(paraIdx => {
        const comments = commentsByParagraph[paraIdx];
        const paragraphPreview = paragraphs[paraIdx]?.substring(0, 100) || '';
        
        text += `────────────────────────────────────────\n`;
        text += `PARAGRAPH ${paraIdx + 1}\n`;
        text += `"${paragraphPreview}${paragraphPreview.length >= 100 ? '...' : ''}"\n`;
        text += `────────────────────────────────────────\n\n`;

        comments.forEach(c => {
          const status = c.status === 'implemented' ? '✓ APPROVED' : 
                        c.status === 'resolved' ? '✗ REJECTED' : '○ OPEN';
          text += `[${status}] ${c.author}\n`;
          if (c.textSelection) {
            text += `  Highlighted: "${c.textSelection}"\n`;
          }
          text += `  Comment: ${c.content}\n`;
          if (c.replies.length > 0) {
            c.replies.forEach(r => {
              text += `    └─ ${r.author}: ${r.content}\n`;
            });
          }
          text += `\n`;
        });
      });

    // Global feedback
    if (session.globalFeedback && session.globalFeedback.length > 0) {
      text += `\n═══════════════════════════════════════\n`;
      text += `OVERALL FEEDBACK\n`;
      text += `═══════════════════════════════════════\n\n`;
      
      session.globalFeedback.forEach(fb => {
        const category = fb.category === 'worked' ? 'What Worked' :
                        fb.category === 'didnt-work' ? "What Didn't Work" :
                        fb.category === 'confusing' ? 'Confusing Parts' : 'Overall Thoughts';
        text += `[${category}] ${fb.author}\n`;
        text += `${fb.text}\n\n`;
      });
    }

    return text;
  };

  const generateHtmlForEmail = (): string => {
    // Generate a beautiful HTML email similar to shoutout emails
    const totalComments = session.comments.length;
    const openComments = session.comments.filter(c => c.status === 'open').length;
    const approvedComments = session.comments.filter(c => c.status === 'implemented').length;
    const rejectedComments = session.comments.filter(c => c.status === 'resolved').length;

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
    <div style="max-width: 650px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${session.title}</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 12px 0 0 0; font-size: 16px;">Feedback Report for ${session.authorName}</p>
            <p style="color: rgba(255,255,255,0.75); margin: 8px 0 0 0; font-size: 14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Summary Stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 35px;">
                <div style="text-align: center; padding: 20px; background: #eef2ff; border-radius: 12px; border: 2px solid #c7d2fe;">
                    <div style="font-size: 32px; font-weight: bold; color: #6366f1; margin-bottom: 5px;">${openComments}</div>
                    <div style="font-size: 11px; color: #6366f1; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Open</div>
                </div>
                <div style="text-align: center; padding: 20px; background: #d1fae5; border-radius: 12px; border: 2px solid #a7f3d0;">
                    <div style="font-size: 32px; font-weight: bold; color: #059669; margin-bottom: 5px;">${approvedComments}</div>
                    <div style="font-size: 11px; color: #059669; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Approved</div>
                </div>
                <div style="text-align: center; padding: 20px; background: #fee2e2; border-radius: 12px; border: 2px solid #fecaca;">
                    <div style="font-size: 32px; font-weight: bold; color: #dc2626; margin-bottom: 5px;">${rejectedComments}</div>
                    <div style="font-size: 11px; color: #dc2626; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Rejected</div>
                </div>
            </div>

            <!-- Greeting -->
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
                Hey <strong>${session.authorName}</strong>! 👋
            </p>
            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Here's your feedback summary with <strong>${totalComments} comment${totalComments !== 1 ? 's' : ''}</strong> from your readers. Each piece of feedback is organized by paragraph to help you review and implement changes easily.
            </p>

            <!-- Comments by Paragraph -->
            <div style="margin-bottom: 35px;">
                <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 20px 0; padding-bottom: 12px; border-bottom: 3px solid #e2e8f0; font-weight: 700;">
                    💬 Comments by Paragraph
                </h2>
    `;

    Object.keys(commentsByParagraph)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(paraIdx => {
        const comments = commentsByParagraph[paraIdx];
        const paragraphPreview = paragraphs[paraIdx]?.substring(0, 150) || '';

        html += `
                <div style="border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(to right, #f8fafc, #f1f5f9); padding: 15px 20px; border-bottom: 2px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px;">Paragraph ${paraIdx + 1}</span>
                            <span style="background: #6366f1; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">${comments.length} comment${comments.length !== 1 ? 's' : ''}</span>
                        </div>
                        <p style="margin: 0; font-style: italic; color: #475569; font-size: 13px; line-height: 1.5;">"${paragraphPreview}${paragraphPreview.length >= 150 ? '...' : ''}"</p>
                    </div>
        `;

        comments.forEach((c, idx) => {
          const statusConfig = c.status === 'implemented'
            ? { color: '#059669', bg: '#d1fae5', label: '✓ Approved', emoji: '✅' }
            : c.status === 'resolved'
            ? { color: '#dc2626', bg: '#fee2e2', label: '✗ Rejected', emoji: '❌' }
            : { color: '#6366f1', bg: '#eef2ff', label: 'Open', emoji: '💭' };

          const isLastComment = idx === comments.length - 1;

          html += `
                    <div style="padding: 20px; ${!isLastComment ? 'border-bottom: 1px solid #f1f5f9;' : ''}">
                        <div style="display: flex; align-items: center; margin-bottom: 12px; gap: 10px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${statusConfig.color}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0;">${c.author.charAt(0).toUpperCase()}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: #1e293b; font-size: 14px;">${c.author}</div>
                                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <span style="padding: 5px 12px; background: ${statusConfig.bg}; color: ${statusConfig.color}; font-size: 10px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">${statusConfig.emoji} ${statusConfig.label}</span>
                        </div>
                        ${c.textSelection ? `<div style="background: #f0f9ff; border-left: 3px solid #0284c7; padding: 10px 15px; margin-bottom: 12px; border-radius: 6px;">
                            <div style="font-size: 10px; color: #0369a1; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px;">📍 Highlighted Text</div>
                            <div style="font-size: 13px; color: #0c4a6e; font-style: italic; line-height: 1.5;">"${c.textSelection}"</div>
                        </div>` : ''}
                        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">${c.content}</p>
                        ${c.rating ? `<div style="margin-top: 10px;"><span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">🏆 ${c.rating}</span></div>` : ''}
                        ${c.replies.length > 0 ? `
                        <div style="margin-top: 15px; padding-left: 15px; border-left: 3px solid #e2e8f0;">
                            ${c.replies.map(r => `
                            <div style="margin-top: 10px; padding: 10px; background: #f8fafc; border-radius: 8px;">
                                <span style="font-weight: 700; color: #475569; font-size: 13px;">${r.author}:</span>
                                <span style="color: #64748b; font-size: 13px; margin-left: 5px;">${r.content}</span>
                            </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
          `;
        });

        html += `</div>`;
      });

    html += `</div>`;

    // Overall Feedback section
    if (session.globalFeedback && session.globalFeedback.length > 0) {
      html += `
            <div style="margin-top: 35px;">
                <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 20px 0; padding-bottom: 12px; border-bottom: 3px solid #e2e8f0; font-weight: 700;">
                    🌟 Overall Feedback
                </h2>
      `;

      session.globalFeedback.forEach(fb => {
        const categoryConfig = fb.category === 'worked'
          ? { label: '✨ What Worked', bg: '#d1fae5', color: '#065f46', border: '#10b981' }
          : fb.category === 'didnt-work'
          ? { label: '🔧 What Didn\'t Work', bg: '#fee2e2', color: '#991b1b', border: '#ef4444' }
          : fb.category === 'confusing'
          ? { label: '❓ Confusing Parts', bg: '#fef3c7', color: '#78350f', border: '#f59e0b' }
          : { label: '💭 Overall Thoughts', bg: '#eef2ff', color: '#3730a3', border: '#6366f1' };

        html += `
                <div style="border: 2px solid ${categoryConfig.border}; border-radius: 12px; padding: 20px; margin-bottom: 15px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="display: flex; align-items: center; margin-bottom: 15px; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${categoryConfig.bg}; color: ${categoryConfig.color}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; flex-shrink: 0;">${fb.author.charAt(0).toUpperCase()}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; color: #1e293b; font-size: 15px;">${fb.author}</div>
                            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${new Date(fb.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <span style="padding: 6px 14px; background: ${categoryConfig.bg}; color: ${categoryConfig.color}; font-size: 11px; font-weight: 700; border-radius: 20px; letter-spacing: 0.3px;">${categoryConfig.label}</span>
                    </div>
                    <p style="margin: 0; white-space: pre-wrap; color: #334155; font-size: 15px; line-height: 1.7;">${fb.text}</p>
                </div>
        `;
      });

      html += `</div>`;
    }

    html += `
            <!-- Call to Action / Reminder -->
            <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px; padding: 25px; margin-top: 35px; border: 2px solid #7dd3fc;">
                <div style="font-weight: bold; color: #0c4a6e; margin-bottom: 10px; font-size: 16px;">💡 Next Steps</div>
                <p style="color: #075985; font-size: 14px; margin: 0; line-height: 1.6;">
                    Review each comment carefully and consider which feedback to implement in your revisions. Remember, you're the author—trust your creative vision while staying open to constructive suggestions!
                </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.6;">
                    Happy writing! ✍️<br>
                    <em style="font-size: 12px;">Generated by Critique Room on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</em>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return html;
  };

  const getStatusBadge = (status: Comment['status']) => {
    if (status === 'implemented') {
      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'} print:bg-emerald-50`}><ThumbsUp size={10}/> Approved</span>;
    }
    if (status === 'resolved') {
      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'} print:bg-red-50`}><Frown size={10}/> Rejected</span>;
    }
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-slate-100 text-slate-600'} print:bg-slate-50`}>Open</span>;
  };

  // Theme-aware styles
  const modalBg = isDark ? 'bg-neutral-900' : 'bg-white';
  const textPrimary = isDark ? 'text-neutral-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-neutral-700' : 'border-slate-200';
  const cardBg = isDark ? 'bg-neutral-800' : 'bg-slate-50';
  const inputBg = isDark ? 'bg-neutral-800 border-neutral-600 text-neutral-100 placeholder:text-neutral-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400';

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
        <div className={`${modalBg} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border ${borderColor}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${borderColor} no-print`}>
            <div>
              <h2 className={`text-xl font-black ${textPrimary}`}>Export Feedback</h2>
              <p className={`text-sm ${textSecondary} mt-1`}>Print, copy, or email your feedback summary</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${showEmailForm ? 'bg-indigo-600 text-white' : (isDark ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}`}
              >
                <Mail size={16} />
                Email
              </button>
              <button
                onClick={handleCopyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all"
              >
                <Printer size={16} />
                Print / PDF
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Email Form */}
          {showEmailForm && (
            <div className={`p-4 border-b ${borderColor} no-print`}>
              <div className={`flex items-center gap-3 p-4 rounded-xl ${cardBg}`}>
                <Mail size={20} className={textSecondary} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className={`flex-1 px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 ${inputBg}`}
                />
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || emailSent}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : emailSent ? (
                    <Check size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  {emailSent ? 'Sent!' : 'Send'}
                </button>
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-500 font-medium">{emailError}</p>
              )}
              <p className={`mt-2 text-xs ${textSecondary}`}>
                Your email is not saved. It's only used to send this single report.
              </p>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div ref={printRef} className="print-area">
              {/* Document Header */}
              <div className={`text-center mb-8 pb-6 border-b-2 ${borderColor}`}>
                <h1 className={`text-3xl font-black mb-2 ${textPrimary}`}>{session.title}</h1>
                <p className={textSecondary}>Feedback Report for {session.authorName}</p>
                <div className={`flex items-center justify-center gap-6 mt-4 text-sm ${textSecondary}`}>
                  <span className="flex items-center gap-1"><Clock size={14} /> {new Date().toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={14} /> {session.comments.length} comments</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className={`${cardBg} rounded-xl p-4 text-center print:border print:border-slate-200`}>
                  <div className="text-2xl font-black text-indigo-500">{session.comments.filter(c => c.status === 'open').length}</div>
                  <div className={`text-xs font-bold uppercase ${textSecondary}`}>Open</div>
                </div>
                <div className={`${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'} rounded-xl p-4 text-center print:border print:border-emerald-200`}>
                  <div className="text-2xl font-black text-emerald-500">{session.comments.filter(c => c.status === 'implemented').length}</div>
                  <div className={`text-xs font-bold uppercase ${textSecondary}`}>Approved</div>
                </div>
                <div className={`${isDark ? 'bg-red-900/30' : 'bg-red-50'} rounded-xl p-4 text-center print:border print:border-red-200`}>
                  <div className="text-2xl font-black text-red-500">{session.comments.filter(c => c.status === 'resolved').length}</div>
                  <div className={`text-xs font-bold uppercase ${textSecondary}`}>Rejected</div>
                </div>
              </div>

              {/* Comments by Paragraph */}
              <div className="space-y-6">
                <h2 className={`text-lg font-black flex items-center gap-2 ${textPrimary}`}>
                  <MessageSquare size={18} className="text-indigo-500" />
                  Comments by Paragraph
                </h2>

                {Object.keys(commentsByParagraph).length === 0 ? (
                  <p className={`text-center py-8 ${textSecondary}`}>No comments yet.</p>
                ) : (
                  Object.keys(commentsByParagraph)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map(paraIdx => {
                      const comments = commentsByParagraph[paraIdx];
                      const paragraphPreview = paragraphs[paraIdx]?.substring(0, 150) || '';
                      
                      return (
                        <div key={paraIdx} className={`border ${borderColor} rounded-xl overflow-hidden print:break-inside-avoid`}>
                          {/* Paragraph Header */}
                          <div className={`${cardBg} px-4 py-3 border-b ${borderColor}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-black uppercase ${textSecondary}`}>Paragraph {paraIdx + 1}</span>
                              <span className={`text-xs font-bold ${textSecondary}`}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                            </div>
                            <p className={`text-sm mt-1 italic line-clamp-2 ${textSecondary}`}>
                              "{paragraphPreview}{paragraphPreview.length >= 150 ? '...' : ''}"
                            </p>
                          </div>
                          
                          {/* Comments */}
                          <div className={`divide-y ${isDark ? 'divide-neutral-700' : 'divide-slate-100'}`}>
                            {comments.map(c => {
                              const flower = FLOWERS.find(f => f.name === c.author) || { color: '#6366f1' };
                              return (
                                <div key={c.id} className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 print:border print:border-slate-300"
                                      style={{ backgroundColor: flower.color }}
                                    >
                                      {c.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`font-bold ${textPrimary}`}>{c.author}</span>
                                        {getStatusBadge(c.status)}
                                        {c.rating && (
                                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                            {c.rating}
                                          </span>
                                        )}
                                      </div>
                                      {c.textSelection && (
                                        <p className={`text-xs italic mb-2 px-2 py-1 rounded ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                          On: "{c.textSelection}"
                                        </p>
                                      )}
                                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>{c.content}</p>
                                      
                                      {/* Replies */}
                                      {c.replies.length > 0 && (
                                        <div className={`mt-3 pl-4 border-l-2 space-y-2 ${isDark ? 'border-neutral-600' : 'border-slate-200'}`}>
                                          {c.replies.map(r => (
                                            <div key={r.id} className="text-sm">
                                              <span className={`font-bold ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>{r.author}:</span>{' '}
                                              <span className={isDark ? 'text-neutral-400' : 'text-slate-600'}>{r.content}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Overall Feedback */}
              {session.globalFeedback && session.globalFeedback.length > 0 && (
                <div className={`mt-8 pt-6 border-t-2 ${borderColor} print:break-before-page`}>
                  <h2 className={`text-lg font-black mb-4 ${textPrimary}`}>Overall Feedback</h2>
                  <div className="space-y-4">
                    {session.globalFeedback.map((fb, idx) => {
                      const flower = FLOWERS.find(f => f.name === fb.author) || { color: '#6366f1' };
                      const categoryLabel = fb.category === 'worked' ? 'What Worked' :
                                           fb.category === 'didnt-work' ? "What Didn't Work" :
                                           fb.category === 'confusing' ? 'Confusing Parts' : 'Overall Thoughts';
                      const categoryColor = fb.category === 'worked' 
                        ? (isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                        : fb.category === 'didnt-work' 
                        ? (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700')
                        : fb.category === 'confusing' 
                        ? (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700')
                        : (isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700');
                      
                      return (
                        <div key={idx} className={`border ${borderColor} rounded-xl p-4 print:break-inside-avoid`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: flower.color }}
                            >
                              {fb.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className={`font-bold ${textPrimary}`}>{fb.author}</span>
                              <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${categoryColor}`}>
                                {categoryLabel}
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>{fb.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className={`mt-8 pt-6 border-t ${borderColor} text-center text-xs ${textSecondary}`}>
                Generated by Critique Room • {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FeedbackExportModal;
