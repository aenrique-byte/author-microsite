
/**
 * WriterWorkspace - Author Workspace for creating critique sessions
 * Migrated from critiqueroom/pages/UploadPage.tsx with API integration
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedbackMode, ExpirationOption, WritingSection, FontCombo } from '../types';
import { critiqueRoomAPI, markAsLocalAuthor } from '../utils/api-critiqueroom';
import { useTheme } from '../../storytime/contexts/ThemeContext';
import PageNavbar from '../../../components/PageNavbar';
import SocialIcons from '../../../components/SocialIcons';
import { 
  FileUp, 
  X, 
  Share2, 
  Eye, 
  Edit3, 
  Bookmark, 
  AlertTriangle,
  Lock,
  Calendar,
  Type,
  List,
  GripVertical,
  Trash2,
  Plus,
  Check,
  Loader2,
  Copy,
  ExternalLink,
  PartyPopper
} from 'lucide-react';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export function WriterWorkspace() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [selectedModes, setSelectedModes] = useState<FeedbackMode[]>([]);
  const [sections, setSections] = useState<WritingSection[]>([]);
  const [expiration, setExpiration] = useState<ExpirationOption>(ExpirationOption.H72);
  const [fontCombo, setFontCombo] = useState<FontCombo>('LITERARY');
  const [wordCount, setWordCount] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Theme support
  const { theme } = useTheme();
  
  // New: Inline section addition state
  const [activeParaForSection, setActiveParaForSection] = useState<number | null>(null);
  const [tempSectionLabel, setTempSectionLabel] = useState('');

  const paragraphs = useMemo(() => content.split('\n').filter(p => p.trim() !== ''), [content]);

  useEffect(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    setWordCount(words);
  }, [content]);

  const toggleMode = (mode: FeedbackMode) => {
    setSelectedModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleConfirmSection = () => {
    if (activeParaForSection !== null && tempSectionLabel.trim()) {
      setSections([...sections, { 
        id: Math.random().toString(36).substr(2, 9), 
        label: tempSectionLabel.trim(), 
        paragraphIndex: activeParaForSection 
      }]);
      setActiveParaForSection(null);
      setTempSectionLabel('');
    }
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const handleRenameSection = (id: string, currentLabel: string) => {
    const newLabel = prompt("Rename section:", currentLabel);
    if (newLabel) {
      setSections(sections.map(s => s.id === id ? { ...s, label: newLabel } : s));
    }
  };

  const wordCountNudge = useMemo(() => {
    if (wordCount > 10000) return "Long submissions receive fewer comments. Consider splitting into sections.";
    if (wordCount > 5000) return "Consider posting an excerpt for more focused feedback.";
    if (wordCount > 3000) return "Longer pieces may get less line-level feedback.";
    return null;
  }, [wordCount]);

  const processFiles = async (files: FileList) => {
    setImportStatus('Processing...');
    let combinedContent = content;
    const newSections = [...sections];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      let text = '';

      try {
        if (extension === 'docx') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (extension === 'odt') {
          // Parse ODT (OpenDocument Text) - it's a ZIP containing content.xml
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);
          const contentXml = await zip.file('content.xml')?.async('string');
          if (contentXml) {
            // Extract text from XML - remove all tags and get text content
            const parser = new DOMParser();
            const doc = parser.parseFromString(contentXml, 'application/xml');
            // Get all text:p elements (paragraphs in ODT)
            const paragraphs = doc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0', 'p');
            const textParts: string[] = [];
            for (let i = 0; i < paragraphs.length; i++) {
              const para = paragraphs[i].textContent?.trim();
              if (para) textParts.push(para);
            }
            text = textParts.join('\n\n');
          }
        } else if (extension === 'txt' || extension === 'md') {
          text = await file.text();
        } else {
          continue;
        }

        const currentParaCount = combinedContent.split('\n').filter(p => p.trim() !== '').length;
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        
        newSections.push({
          id: Math.random().toString(36).substr(2, 9),
          label: cleanName,
          paragraphIndex: currentParaCount
        });

        combinedContent += (combinedContent ? '\n\n' : '') + text;
      } catch (err) {
        console.error(err);
      }
    }

    setContent(combinedContent);
    setSections(newSections);
    setImportStatus(`${files.length} file(s) imported`);
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleCreate = async () => {
    setAttemptedSubmit(true);
    setPublishError(null);
    
    if (!title || !content || selectedModes.length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsPublishing(true);

    try {
      const response = await critiqueRoomAPI.sessions.create({
        title,
        content,
        authorName: authorName || 'Anonymous Author',
        modes: selectedModes,
        questions: [],
        sections,
        expiration,
        fontCombo,
        password: password || undefined,
      });

      // Mark as local author for anonymous sessions
      markAsLocalAuthor(response.id);
      
      // Show success modal with session ID
      setCreatedSessionId(response.id);
      setShowSuccessModal(true);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to create session');
      console.error('Failed to create session:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const getFontClass = (combo: FontCombo) => {
    if (combo === 'LITERARY') return 'font-source-serif';
    if (combo === 'MODERN') return 'font-literata';
    if (combo === 'PAPERBACK') return 'font-merriweather';
    return 'serif-font';
  };

  const isTitleMissing = attemptedSubmit && !title;
  const isContentMissing = attemptedSubmit && !content;
  const isModesMissing = attemptedSubmit && selectedModes.length === 0;

  // Theme-aware styles
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-neutral-300';
  const textMuted = theme === 'light' ? 'text-gray-500' : 'text-neutral-400';
  const textLabel = theme === 'light' ? 'text-gray-500' : 'text-neutral-400';
  const cardBg = theme === 'light' 
    ? 'bg-white/90 backdrop-blur-xl border-gray-200' 
    : 'bg-neutral-900/90 backdrop-blur-xl border-white/10';
  const inputBg = theme === 'light'
    ? 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
    : 'bg-neutral-800/80 border-neutral-700 text-white placeholder:text-neutral-500';
  const inputFocus = theme === 'light'
    ? 'focus:ring-indigo-200 focus:border-indigo-400'
    : 'focus:ring-indigo-500/30 focus:border-indigo-500';
  const buttonUnselected = theme === 'light'
    ? 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-300'
    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:border-indigo-500';

  return (
    <div className={`min-h-screen ${textPrimary}`}>
      <PageNavbar breadcrumbs={[
        { label: 'Critique Room', path: '/critiqueroom' },
        { label: 'Writer Workspace' }
      ]} />  

      {/* Error display */}
      {publishError && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm font-bold">
            <AlertTriangle size={18} /> {publishError}
            <button onClick={() => setPublishError(null)} className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-12 px-6">
      <div className={`mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-8 gap-4 ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
        <div className="space-y-2">
          <h1 className={`text-4xl font-black tracking-tighter ${textPrimary}`}>Author Workspace</h1>
          <p className={`font-medium ${textMuted}`}>Prepare your manuscript for the critique room.</p>
        </div>
        <div className={`flex rounded-xl p-1 border shadow-sm ${theme === 'light' ? 'bg-white/90 border-gray-200' : 'bg-neutral-800/90 border-neutral-700'}`}>
          <button onClick={() => setViewMode('edit')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'edit' ? 'bg-indigo-600 text-white shadow-md' : `${textMuted} hover:text-indigo-400`}`}>
            <Edit3 size={16} /> Draft
          </button>
          <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-md' : `${textMuted} hover:text-indigo-400`}`}>
            <Eye size={16} /> Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {viewMode === 'edit' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center h-5">
                    <label className={`text-xs font-black uppercase tracking-widest ${textLabel}`}>Project Title</label>
                    {isTitleMissing && <span className="text-[10px] font-black text-red-500 uppercase">Required</span>}
                  </div>
                  <input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Title of your work" 
                    className={`w-full px-5 py-3 rounded-2xl border transition-all font-bold text-lg outline-none focus:ring-4 ${isTitleMissing ? 'border-red-500 ring-red-50 bg-red-50 text-gray-900' : `${inputBg} ${inputFocus}`}`} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center h-5">
                    <label className={`text-xs font-black uppercase tracking-widest ${textLabel}`}>Pen Name</label>
                  </div>
                  <input 
                    value={authorName} 
                    onChange={(e) => setAuthorName(e.target.value)} 
                    placeholder="Your pseudonym" 
                    className={`w-full px-5 py-3 rounded-2xl border font-bold text-lg focus:ring-4 outline-none ${inputBg} ${inputFocus}`} 
                  />
                </div>
              </div>

              {/* File Import Section - Separate from textarea */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${theme === 'light' ? 'bg-gray-50/80 border-gray-200' : 'bg-neutral-800/80 border-neutral-700'}`}>
                <div className="flex items-center gap-4">
                  <FileUp size={20} className={textMuted} />
                  <div>
                    <p className={`text-sm font-bold ${textPrimary}`}>Import Documents</p>
                    <p className={`text-xs ${textMuted}`}>Upload .docx, .odt, .txt, or .md files</p>
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:border-indigo-400 hover:text-indigo-500 transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-700' : 'bg-neutral-700 border-neutral-600 text-white'}`}
                >
                  <FileUp size={16} /> Browse Files
                </button>
                <input ref={fileInputRef} type="file" multiple accept=".docx,.odt,.txt,.md" className="hidden" onChange={(e) => e.target.files && processFiles(e.target.files)} />
              </div>
              {importStatus && (
                <div className="text-sm font-bold text-emerald-500 animate-pulse">{importStatus}</div>
              )}

              {/* Manuscript Content Section */}
              <div className="space-y-2 flex-1 flex flex-col">
                <div className={`flex items-center justify-between`}>
                  <label className={`text-xs font-black uppercase tracking-widest ${isContentMissing ? 'text-red-500' : textLabel}`}>
                    Manuscript Content {isContentMissing && '- Required'}
                  </label>
                  <span className={`text-[10px] font-black ${textMuted}`}>{wordCount.toLocaleString()} WORDS</span>
                </div>
                
                <div className="relative group flex-1">
                  <textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    placeholder="Paste your writing here (supports copy-paste from LibreOffice/ODT, Google Docs, etc.)..."
                    style={{ 
                      fontFamily: fontCombo === 'LITERARY' 
                        ? '"Source Serif 4", Georgia, serif' 
                        : fontCombo === 'MODERN' 
                          ? '"Literata", Georgia, serif' 
                          : fontCombo === 'PAPERBACK' 
                            ? '"Merriweather", Georgia, serif' 
                            : 'inherit',
                      transition: 'font-family 0.2s ease'
                    }}
                    className={`w-full min-h-[700px] h-full p-8 rounded-2xl border shadow-sm outline-none text-xl leading-relaxed resize-none transition-all ${isContentMissing ? 'border-red-500 bg-red-50 focus:ring-red-50 text-gray-900' : `${inputBg} focus:ring-8 ${inputFocus}`}`} 
                  />
                  {content && (
                    <button onClick={() => setContent('')} className={`absolute top-4 right-4 p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-neutral-700 text-neutral-400'}`}><X size={18} /></button>
                  )}
                </div>

                {wordCountNudge && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 text-sm font-bold">
                    <AlertTriangle size={18} /> {wordCountNudge}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-16 md:p-24 min-h-[800px]">
                <div className="text-center mb-16 space-y-4">
                  <h2 className={`text-5xl font-black text-slate-900 tracking-tight ${getFontClass(fontCombo)}`}>{title || "Untitled Draft"}</h2>
                  <p className="text-slate-400 uppercase tracking-widest font-black text-xs">by {authorName || "Unknown Author"}</p>
                </div>
                <div className={`${getFontClass(fontCombo)} text-2xl leading-[1.75] text-slate-800 space-y-10`}>
                  {paragraphs.map((p, i) => {
                    const section = sections.find(s => s.paragraphIndex === i);
                    const isAdding = activeParaForSection === i;

                    return (
                      <div key={i} className="group relative">
                        {section && (
                          <div className="mb-4 text-xs font-black text-indigo-400 uppercase tracking-widest border-l-2 border-indigo-200 pl-4 py-1">
                            {section.label}
                          </div>
                        )}
                        <p className={`transition-all ${isAdding ? 'opacity-30 blur-[1px]' : ''}`}>{p}</p>
                        
                        {isAdding ? (
                          <div className="absolute -left-4 md:-left-12 -right-4 md:-right-12 top-0 bottom-0 z-50 flex items-center justify-center bg-indigo-50/10">
                            <div className="bg-white border-2 border-indigo-600 rounded-2xl shadow-2xl p-4 flex gap-2 animate-in zoom-in-95">
                              <input 
                                autoFocus
                                value={tempSectionLabel} 
                                onChange={(e) => setTempSectionLabel(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmSection()}
                                placeholder="Section label..." 
                                className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-200"
                              />
                              <button onClick={handleConfirmSection} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"><Check size={20}/></button>
                              <button onClick={() => setActiveParaForSection(null)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors"><X size={20}/></button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveParaForSection(i);
                            }} 
                            className="absolute -left-6 md:-left-14 top-1 z-30 opacity-40 group-hover:opacity-100 text-indigo-400 hover:text-indigo-600 transition-all p-3 rounded-full bg-indigo-50/50 hover:bg-indigo-100 shadow-sm border border-indigo-200/20" 
                            title="Add Section Marker"
                          >
                            <Bookmark size={20} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {paragraphs.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <Edit3 size={48} className="mx-auto text-slate-200" />
                      <p className="text-slate-400 font-bold">Manuscript is empty. Add text in Draft mode first.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className={`rounded-[2rem] border p-8 space-y-8 shadow-sm transition-all ${isModesMissing ? 'border-red-500 ring-4 ring-red-50' : ''} ${cardBg}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className={`text-xs font-black uppercase tracking-widest ${isModesMissing ? 'text-red-500' : textLabel}`}>Feedback Goals</label>
                {isModesMissing && <span className="text-[10px] font-black text-red-500 uppercase">Select at least one</span>}
              </div>
              <div className="flex flex-col gap-2">
                {Object.values(FeedbackMode).map(mode => (
                  <button key={mode} onClick={() => toggleMode(mode)} className={`text-left px-5 py-3 rounded-2xl text-sm font-bold border transition-all ${selectedModes.includes(mode) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : buttonUnselected}`}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of Contents Section */}
            <div className={`space-y-4 pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-neutral-700'}`}>
              <div className="flex justify-between items-center">
                <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${textLabel}`}>
                  <List size={12}/> Table of Contents
                </label>
                <span className={`text-[9px] font-black uppercase ${textMuted}`}>{sections.length} SECTIONS</span>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
                {sections.length > 0 ? (
                  <div className="space-y-2">
                    {sections.sort((a, b) => a.paragraphIndex - b.paragraphIndex).map(s => (
                      <div key={s.id} className={`group flex items-center justify-between p-3 border rounded-xl transition-all hover:border-indigo-400 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-neutral-800/60 border-neutral-700'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <GripVertical size={14} className={textMuted} />
                          <div className="min-w-0">
                            <button onClick={() => handleRenameSection(s.id, s.label)} className={`text-[11px] font-black truncate block hover:text-indigo-500 ${textSecondary}`}>
                              {s.label}
                            </button>
                            <span className={`text-[9px] font-bold uppercase tracking-tighter ${textMuted}`}>Para {s.paragraphIndex + 1}</span>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveSection(s.id)} className={`p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all ${textMuted}`}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setViewMode('preview')} 
                      className={`w-full py-3 border-2 border-dashed rounded-xl text-[10px] font-black uppercase hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 ${theme === 'light' ? 'border-gray-200 text-gray-400' : 'border-neutral-600 text-neutral-400'}`}
                    >
                      <Plus size={12} /> Add More Sections
                    </button>
                  </div>
                ) : (
                  <div className={`text-center py-8 border-2 border-dashed rounded-[2rem] space-y-4 ${theme === 'light' ? 'border-gray-200' : 'border-neutral-600'}`}>
                    <p className={`text-[10px] font-black uppercase leading-relaxed px-6 ${textMuted}`}>
                      Manually mark chapters, scene breaks, or structural milestones.
                    </p>
                    <button 
                      onClick={() => setViewMode('preview')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600/30 transition-all"
                    >
                      Start Marking Sections
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`space-y-4 pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-neutral-700'}`}>
              <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${textLabel}`}>
                <Type size={12}/> Typography Combo
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => setFontCombo('LITERARY')} className={`px-4 py-3 rounded-xl text-left border transition-all ${fontCombo === 'LITERARY' ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/20' : buttonUnselected}`}>
                  <div className={`text-xs font-black ${textPrimary}`}>Literary & Calm</div>
                  <div className={`text-[10px] font-source-serif ${textMuted}`}>Source Serif 4 / Inter</div>
                </button>
                <button onClick={() => setFontCombo('MODERN')} className={`px-4 py-3 rounded-xl text-left border transition-all ${fontCombo === 'MODERN' ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/20' : buttonUnselected}`}>
                  <div className={`text-xs font-black ${textPrimary}`}>Modern-but-Bookish</div>
                  <div className={`text-[10px] font-literata ${textMuted}`}>Literata / Inter</div>
                </button>
                <button onClick={() => setFontCombo('PAPERBACK')} className={`px-4 py-3 rounded-xl text-left border transition-all ${fontCombo === 'PAPERBACK' ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/20' : buttonUnselected}`}>
                  <div className={`text-xs font-black ${textPrimary}`}>Paperback Feel</div>
                  <div className={`text-[10px] font-merriweather ${textMuted}`}>Merriweather / Inter</div>
                </button>
              </div>
            </div>

            <div className={`space-y-4 pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-neutral-700'}`}>
              <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${textLabel}`}>
                <Lock size={12}/> Session Password
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Optional" className={`w-full px-4 py-2 rounded-xl border text-sm outline-none font-bold ${inputBg} ${inputFocus}`} />
            </div>

            <div className={`space-y-4 pt-8 border-t ${theme === 'light' ? 'border-gray-200' : 'border-neutral-700'}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${textLabel}`}>
                  <Calendar size={12}/> Expiration
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ExpirationOption).map(opt => (
                  <button key={opt} onClick={() => setExpiration(opt)} className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${expiration === opt ? 'bg-indigo-600 border-indigo-600 text-white' : buttonUnselected}`}>{opt}</button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreate}
            disabled={isPublishing}
            className="w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 bg-indigo-700 text-white hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <>
                <Loader2 size={24} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                Launch Room <Share2 size={24} />
              </>
            )}
          </button>
        </aside>
      </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdSessionId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                <PartyPopper size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Session Created!</h2>
              <p className="text-gray-600 text-sm font-medium">
                Your critique session is live. Share the link below with your readers.
              </p>
            </div>

            {/* Session Link Box */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Session Link</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">ID: {createdSessionId}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-700 truncate">
                  {`${window.location.origin}/critiqueroom/session/${createdSessionId}`}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/critiqueroom/session/${createdSessionId}`);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    linkCopied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {linkCopied ? <Check size={18} /> : <Copy size={18} />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 font-medium leading-relaxed">
                <strong>Important:</strong> Save this link! You'll need it to access and manage your session. 
                Without Discord login, this is your only way to prove authorship.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/critiqueroom/session/${createdSessionId}`);
                }}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                Go to Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`mt-16 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
        <SocialIcons variant="footer" showCopyright={true} />
      </footer>
    </div>
  );
}

export default WriterWorkspace;
