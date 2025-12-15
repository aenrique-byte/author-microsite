
import React, { useState, useEffect } from 'react';
import { db } from '../services/api-db';
import { AdminConfig, Booking, AdminShoutout, Story, ThemeColor } from '../types';
import { MonthView } from '../components/MonthView';
import { PreviewBox } from '../components/PreviewBox';
import { BookOpen, Check, Copy, ExternalLink, Lock, User, X, ChevronLeft, ChevronRight, Mail } from 'lucide-react';

interface PublicPageProps {
  onAdminLogin: () => void;
}

// Helper for dynamic colors on the public page
const THEME_STYLES: Record<ThemeColor, { bg: string, text: string, button: string, buttonHover: string, border: string }> = {
    amber: { bg: 'bg-amber-500', text: 'text-amber-500', button: 'bg-amber-500', buttonHover: 'hover:bg-amber-400', border: 'border-amber-500' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-500', button: 'bg-blue-600', buttonHover: 'hover:bg-blue-500', border: 'border-blue-500' },
    rose: { bg: 'bg-rose-600', text: 'text-rose-500', button: 'bg-rose-600', buttonHover: 'hover:bg-rose-500', border: 'border-rose-500' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', button: 'bg-emerald-600', buttonHover: 'hover:bg-emerald-500', border: 'border-emerald-500' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-500', button: 'bg-violet-600', buttonHover: 'hover:bg-violet-500', border: 'border-violet-500' },
    cyan: { bg: 'bg-cyan-600', text: 'text-cyan-500', button: 'bg-cyan-600', buttonHover: 'hover:bg-cyan-500', border: 'border-cyan-500' },
};

export const PublicPage: React.FC<PublicPageProps> = ({ onAdminLogin }) => {
  const [config, setConfig] = useState<AdminConfig>({ monthsToShow: 3 });
  const [stories, setStories] = useState<Story[]>([]);
  
  // Default to first story
  const [selectedStoryId, setSelectedStoryId] = useState<string>('default');
  
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Pagination
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [storyLink, setStoryLink] = useState('');
  const [email, setEmail] = useState('');
  const [shoutoutCode, setShoutoutCode] = useState('');
  const [antiBotChecked, setAntiBotChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  // Admin shoutouts for successful booking
  const [adminShoutouts, setAdminShoutouts] = useState<AdminShoutout[]>([]);
  
  const [loading, setLoading] = useState(true);

  const activeStory = stories.find(s => s.id === selectedStoryId) || stories[0];
  const theme = activeStory ? THEME_STYLES[activeStory.color] : THEME_STYLES.amber;

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Refresh data when story changes
  useEffect(() => {
    if (selectedStoryId && !loading) {
      refreshStoryData();
      // Reset booking selection when story changes
      setSelectedDate(null);
      setBookingSuccess(null);
    }
  }, [selectedStoryId]);

  const loadInitialData = async () => {
    try {
      const [configData, storiesData] = await Promise.all([
        db.getConfig(),
        db.getStories()
      ]);
      
      setConfig(configData);
      setStories(storiesData);
      
      if (storiesData.length > 0) {
        const firstStoryId = storiesData[0].id;
        setSelectedStoryId(firstStoryId);
        
        // Load availability for the first story immediately
        console.log('PublicPage: Loading initial availability for:', firstStoryId);
        const [availability, allBookings, allShoutouts] = await Promise.all([
          db.getAvailability(firstStoryId),
          db.getBookings(firstStoryId),
          db.getAdminShoutouts()
        ]);
        
        console.log('PublicPage: Initial availability loaded:', availability.length, 'dates');
        setAvailableDates(new Set(availability));
        
        // Filter bookings. Both 'approved' and 'pending' should block dates for guests.
        const blockedDates = allBookings
            .filter(b => b.status === 'approved' || b.status === 'pending')
            .map(b => b.dateStr);
        
        setBookedDates(new Set(blockedDates));
        
        // Filter shoutouts relevant to this story or global ones
        const relevant = allShoutouts.filter(s => !s.storyId || s.storyId === firstStoryId);
        setAdminShoutouts(relevant);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      alert('Failed to connect to database. Please check your API configuration.');
    }
  };

  const refreshStoryData = async () => {
    try {
      console.log('PublicPage: Refreshing story data for:', selectedStoryId);
      const [availability, allBookings, allShoutouts] = await Promise.all([
        db.getAvailability(selectedStoryId),
        db.getBookings(selectedStoryId),
        db.getAdminShoutouts()
      ]);
      
      console.log('PublicPage: Availability from API:', availability);
      console.log('PublicPage: Number of available dates:', availability.length);
      
      setAvailableDates(new Set(availability));
      
      // Filter bookings. Both 'approved' and 'pending' should block dates for guests.
      const blockedDates = allBookings
          .filter(b => b.status === 'approved' || b.status === 'pending')
          .map(b => b.dateStr);
      
      setBookedDates(new Set(blockedDates));
      
      // Filter shoutouts relevant to this story or global ones
      const relevant = allShoutouts.filter(s => !s.storyId || s.storyId === selectedStoryId);
      setAdminShoutouts(relevant);
    } catch (error) {
      console.error('Failed to refresh story data:', error);
    }
  };

  // Determine current view month
  const today = new Date();
  const currentViewDate = new Date(today.getFullYear(), today.getMonth() + currentMonthIndex, 1);
  const maxMonths = config.monthsToShow || 3;

  const handleDateClick = (dateStr: string) => {
    if (availableDates.has(dateStr) && !bookedDates.has(dateStr)) {
      setSelectedDate(dateStr);
      setBookingSuccess(null);
      // Reset form
      setAuthorName('');
      setStoryLink('');
      setEmail('');
      setShoutoutCode('');
      setAntiBotChecked(false);
      // Scroll to form (simple implementation)
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !antiBotChecked) return;
    
    setIsSubmitting(true);

    try {
      const newBooking = await db.createBooking({
          dateStr: selectedDate,
          storyId: selectedStoryId,
          authorName,
          storyLink,
          shoutoutCode,
          email
      });
      
      // Refresh data
      await refreshStoryData();
      setBookingSuccess(newBooking);
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Hero Section */}
      <div className="bg-slate-900 dark:bg-black text-white pb-20 pt-8 px-4 shadow-lg border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
            {/* Story Selector */}
            {stories.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start animate-fade-in">
                    {stories.map(story => (
                        <button
                            key={story.id}
                            onClick={() => setSelectedStoryId(story.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                selectedStoryId === story.id 
                                ? `${THEME_STYLES[story.color].bg} text-white shadow-lg scale-105` 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {story.title}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-8 animate-fade-in key={selectedStoryId}">
                <div className="w-48 h-72 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border-4 border-slate-700/50 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                    <img src={activeStory.coverImage} alt={activeStory.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className={`inline-block px-3 py-1 bg-white/10 ${theme.text} rounded-full text-xs font-bold tracking-wider uppercase mb-2 border border-white/10`}>
                        Official Shoutout Manager
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">{activeStory.title}</h1>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Looking for a shoutout swap for <strong>{activeStory.title}</strong>? Check the calendar below for available slots. 
                        Book a day, share your code, and grab mine!
                    </p>
                    <a href={activeStory.link} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 ${theme.button} ${theme.buttonHover} text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-black/20`}>
                        <BookOpen size={20}/> Read on Royal Road
                    </a>
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto -mt-10 px-4 pb-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar Column */}
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4 bg-white dark:bg-slate-800/50 p-2 rounded-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700/50">
                    <button 
                    onClick={() => setCurrentMonthIndex(i => Math.max(0, i - 1))}
                    disabled={currentMonthIndex <= 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold text-sm"
                    >
                    <ChevronLeft size={18} /> Prev
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                    Available Months
                    </span>
                    <button 
                    onClick={() => setCurrentMonthIndex(i => Math.min(maxMonths - 1, i + 1))}
                    disabled={currentMonthIndex >= maxMonths - 1}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold text-sm"
                    >
                    Next <ChevronRight size={18} />
                    </button>
                </div>

                <MonthView
                    year={currentViewDate.getFullYear()}
                    month={currentViewDate.getMonth()}
                    availableDates={availableDates}
                    bookedDates={bookedDates}
                    onDateClick={handleDateClick}
                    color={activeStory.color}
                />
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                    {/* Booking Form Card */}
                    {selectedDate && !bookingSuccess && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up">
                            <div className={`${theme.bg} p-4 flex justify-between items-center text-white`}>
                                <h3 className="font-bold text-lg">Request {selectedDate}</h3>
                                <button onClick={() => setSelectedDate(null)} className="hover:bg-white/20 p-1 rounded"><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Author / Discord Name</label>
                                    <input 
                                        required
                                        value={authorName}
                                        onChange={e => setAuthorName(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="e.g. RRAngel"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email (for confirmation)</label>
                                    <input 
                                        required
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Story Link</label>
                                    <input 
                                        required
                                        type="url"
                                        value={storyLink}
                                        onChange={e => setStoryLink(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="https://royalroad.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Shoutout Code (HTML)</label>
                                    <textarea 
                                        required
                                        value={shoutoutCode}
                                        onChange={e => setShoutoutCode(e.target.value)}
                                        className="w-full h-32 p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="<table>...</table>"
                                    />
                                </div>

                                {shoutoutCode && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Preview</label>
                                        <div className="scale-75 origin-top-left border border-slate-200 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-800">
                                            <PreviewBox html={shoutoutCode} />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${antiBotChecked ? `${theme.bg} ${theme.border}` : 'border-slate-300 dark:border-slate-500'}`}>
                                            {antiBotChecked && <Check size={14} className="text-white"/>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={antiBotChecked} onChange={e => setAntiBotChecked(e.target.checked)} />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">I am human (Anti-bot)</span>
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={!antiBotChecked || isSubmitting}
                                    className={`w-full py-3 ${theme.button} ${theme.buttonHover} text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                                >
                                    {isSubmitting ? 'Sending Request...' : 'Send Shoutout Request'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Success State */}
                    {bookingSuccess && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-green-200 dark:border-green-800 overflow-hidden animate-slide-up">
                            <div className="bg-green-600 p-4 text-white text-center">
                                <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                                    <Mail size={24} />
                                </div>
                                <h3 className="font-bold text-lg">Request Sent!</h3>
                                <p className="text-green-100 text-sm">Pending approval for {bookingSuccess.dateStr}</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <p className="text-slate-600 dark:text-slate-300 text-sm">
                                    Thanks <strong>{bookingSuccess.authorName}</strong>! Your request has been sent to the admin. 
                                    <br/><br/>
                                    You will receive a confirmation email at <strong>{bookingSuccess.email}</strong> once approved.
                                </p>
                                
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-t pt-4 dark:border-slate-700">
                                    In the meantime, grab my code below:
                                </p>

                                {adminShoutouts.length === 0 && (
                                    <p className="text-red-500 text-xs italic">No shoutout codes configured for this story yet.</p>
                                )}

                                {adminShoutouts.map(s => (
                                    <div key={s.id} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{s.label}</span>
                                            <button onClick={() => copyToClipboard(s.code)} className={`${theme.text} hover:opacity-80 text-xs font-bold flex items-center gap-1`}>
                                                <Copy size={12} /> Copy Code
                                            </button>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs font-mono text-slate-500 dark:text-slate-400 h-20 overflow-y-auto whitespace-pre-wrap select-all">
                                            {s.code}
                                        </div>
                                    </div>
                                ))}

                                <button onClick={() => { setSelectedDate(null); setBookingSuccess(null); }} className="w-full py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Default State (Instructions) */}
                    {!selectedDate && !bookingSuccess && (
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                             <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">How it works</h3>
                             <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                 <li className="flex gap-3">
                                     <span className={`${theme.bg} opacity-20 text-black font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border ${theme.border}`}>1</span>
                                     <span>Find a <span className={`${theme.text} font-bold`}>colored</span> date on the calendar.</span>
                                 </li>
                                 <li className="flex gap-3">
                                     <span className={`${theme.bg} opacity-20 text-black font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border ${theme.border}`}>2</span>
                                     <span>Request the slot with your story details.</span>
                                 </li>
                                 <li className="flex gap-3">
                                     <span className={`${theme.bg} opacity-20 text-black font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border ${theme.border}`}>3</span>
                                     <span>Wait for approval (you'll get an email). Grab my code while you wait!</span>
                                 </li>
                             </ul>
                             
                             <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 text-center">
                                 <p className="text-xs text-slate-400 mb-2">Owner of this site?</p>
                                 <button onClick={onAdminLogin} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1 mx-auto">
                                     <Lock size={12} /> Admin Login
                                 </button>
                             </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
      </main>

      <footer className="bg-slate-900 dark:bg-black text-slate-500 dark:text-slate-600 py-8 text-center text-sm border-t border-slate-800">
          <p>&copy; {new Date().getFullYear()} {activeStory.title} Shoutout Manager.</p>
      </footer>
    </div>
  );
};
