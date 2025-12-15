
import React, { useState, useEffect } from 'react';
import { db } from '../services/api-db';
import { AdminConfig, AdminShoutout, Story, ThemeColor, Booking } from '../types';
import { MonthView } from '../components/MonthView';
import { PreviewBox } from '../components/PreviewBox';
import { ArrowLeft, ArrowRight, Trash2, Plus, RefreshCw, ChevronLeft, ChevronRight, Settings, Calendar, Megaphone, Book, Inbox, Check, X, ExternalLink, Copy, ClipboardList } from 'lucide-react';

interface AdminPageProps {
  onExit: () => void;
}

const COLORS: ThemeColor[] = ['amber', 'blue', 'rose', 'emerald', 'violet', 'cyan'];

export const AdminPage: React.FC<AdminPageProps> = ({ onExit }) => {
  const [config, setConfig] = useState<AdminConfig>({ monthsToShow: 3 });
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string>('default');
  
  const [shoutouts, setShoutouts] = useState<AdminShoutout[]>([]);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Booking[]>([]);
  const [approvedBookings, setApprovedBookings] = useState<Booking[]>([]);
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings' | 'shoutouts' | 'stories' | 'requests' | 'copylist'>('calendar');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [emailTestTarget, setEmailTestTarget] = useState<string>('');

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Sync data when active story changes
  useEffect(() => {
    if (activeStoryId && !loading) {
      refreshStoryData();
    }
  }, [activeStoryId]);

  const loadInitialData = async () => {
    try {
      const [configData, storiesData, shoutsData] = await Promise.all([
        db.getConfig(),
        db.getStories(),
        db.getAdminShoutouts()
      ]);
      
      setConfig(configData);
      setStories(storiesData);
      setShoutouts(shoutsData);
      
      if (storiesData.length > 0) {
        const firstStoryId = storiesData[0].id;
        setActiveStoryId(firstStoryId);
        
        // Load availability for the first story immediately
        console.log('Loading initial availability for:', firstStoryId);
        const [availability, allBookings] = await Promise.all([
          db.getAvailability(firstStoryId),
          db.getBookings(firstStoryId)
        ]);
        
        console.log('Initial availability loaded:', availability.length, 'dates');
        setAvailableDates(new Set(availability));
        setBookedDates(new Set(allBookings.filter(b => b.status === 'approved').map(b => b.dateStr)));
        setPendingDates(new Set(allBookings.filter(b => b.status === 'pending').map(b => b.dateStr)));
        setPendingRequests(allBookings.filter(b => b.status === 'pending').sort((a,b) => a.dateStr.localeCompare(b.dateStr)));
        setApprovedBookings(allBookings.filter(b => b.status === 'approved').sort((a,b) => a.dateStr.localeCompare(b.dateStr)));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      alert('Failed to connect to database. Please check your API configuration.');
    }
  };

  const refreshStoryData = async () => {
    try {
      console.log('Refreshing story data for:', activeStoryId);
      const [availability, allBookings, shoutsData] = await Promise.all([
        db.getAvailability(activeStoryId),
        db.getBookings(activeStoryId),
        db.getAdminShoutouts()
      ]);
      
      console.log('Availability from API:', availability);
      console.log('Number of available dates:', availability.length);
      
      const newAvailableSet = new Set(availability);
      console.log('Set size:', newAvailableSet.size);
      console.log('Sample dates in set:', Array.from(newAvailableSet).slice(0, 5));
      
      setAvailableDates(newAvailableSet);
      setBookedDates(new Set(allBookings.filter(b => b.status === 'approved').map(b => b.dateStr)));
      setPendingDates(new Set(allBookings.filter(b => b.status === 'pending').map(b => b.dateStr)));
      setPendingRequests(allBookings.filter(b => b.status === 'pending').sort((a,b) => a.dateStr.localeCompare(b.dateStr)));
      setApprovedBookings(allBookings.filter(b => b.status === 'approved').sort((a,b) => a.dateStr.localeCompare(b.dateStr)));
      setShoutouts(shoutsData);
      
      console.log('✓ Story data refreshed');
    } catch (error) {
      console.error('Failed to refresh story data:', error);
    }
  };

  const handleConfigChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newConfig = { ...config, [name]: name === 'monthsToShow' ? parseInt(value) : value };
    setConfig(newConfig);
    await db.updateConfig(newConfig);
  };

  // --- STORY MANAGEMENT ---
  const handleStoryChange = async (id: string, field: keyof Story, value: string) => {
      const newStories = stories.map(s => s.id === id ? { ...s, [field]: value } : s);
      setStories(newStories);
      const updated = newStories.find(s => s.id === id);
      if (updated) await db.upsertStory(updated);
  };

  const addStory = async () => {
      const newStory: Story = {
          id: Date.now().toString(),
          title: 'New Story Title',
          link: 'https://royalroad.com/...',
          coverImage: 'https://picsum.photos/400/600',
          color: 'blue'
      };
      const list = [...stories, newStory];
      setStories(list);
      await db.upsertStory(newStory);
      setActiveStoryId(newStory.id);
  };

  const deleteStory = async (id: string) => {
      if (stories.length <= 1) {
          alert("You must have at least one story.");
          return;
      }
      if (confirm("Are you sure? This will delete all availability and bookings for this story.")) {
          await db.deleteStory(id);
          const newStories = stories.filter(s => s.id !== id);
          setStories(newStories);
          if (activeStoryId === id) setActiveStoryId(newStories[0].id);
      }
  };

  // --- SHOUTOUT MANAGEMENT ---
  const handleShoutoutChange = async (id: string, field: keyof AdminShoutout, value: string) => {
    const newShoutouts = shoutouts.map(s => s.id === id ? { ...s, [field]: value } : s);
    setShoutouts(newShoutouts);
    const updated = newShoutouts.find(s => s.id === id);
    if (updated) await db.upsertAdminShoutout(updated);
  };

  const addShoutout = async () => {
    if (shoutouts.length >= 10) return; // Cap at 10 for sanity
    const newS: AdminShoutout = { 
        id: Date.now().toString(), 
        label: 'New Shoutout', 
        code: '<b>Code here</b>', 
        storyId: activeStoryId 
    };
    const list = [...shoutouts, newS];
    setShoutouts(list);
    await db.upsertAdminShoutout(newS);
  };

  const deleteShoutout = async (id: string) => {
    const list = shoutouts.filter(s => s.id !== id);
    setShoutouts(list);
    await db.deleteAdminShoutout(id);
  };

  // --- REQUESTS & APPROVALS ---
  const approveRequest = async (booking: Booking) => {
      if (!confirm(`Approve request for ${booking.dateStr}?\n\nThis will send a confirmation email to ${booking.email} with your shoutout code.`)) return;
      
      await db.updateBookingStatus(booking.id, 'approved');
      alert(`✅ Approved!\n\nConfirmation email sent to:\n${booking.email}\n\nThe email includes your shoutout code and story details.`);
      await refreshStoryData();
  };

  const rejectRequest = async (booking: Booking) => {
      if (!confirm(`Reject request? The date will become available again.`)) return;
      
      await db.deleteBooking(booking.id); // Simple rejection deletes it, clearing the slot
      // Alternatively set status to 'rejected' if we want history
      await refreshStoryData();
  };

  const deleteApprovedBooking = async (booking: Booking) => {
      if (!confirm(`Delete this approved shoutout for ${booking.dateStr}?\n\nAuthor: ${booking.authorName}\n\nThis will free up the date slot.`)) return;
      
      await db.deleteBooking(booking.id);
      await refreshStoryData();
  };

  // --- AVAILABILITY ---
  const toggleDateAvailability = async (dateStr: string) => {
    console.log('Toggling availability for:', dateStr, 'Story:', activeStoryId);
    const newSet = new Set(availableDates);
    const isAvailable = newSet.has(dateStr);
    
    try {
      if (isAvailable) {
        console.log('Removing availability...');
        await db.setAvailability(activeStoryId, dateStr, false);
        console.log('✓ Removed from database');
      } else {
        console.log('Adding availability...');
        await db.setAvailability(activeStoryId, dateStr, true);
        console.log('✓ Added to database');
      }
      
      // Refresh data from database to ensure UI is in sync
      await refreshStoryData();
      console.log('✓ UI refreshed from database');
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      alert('Failed to save availability. Check console for details.');
    }
  };

  // Determine current view month
  const today = new Date();
  const currentViewDate = new Date(today.getFullYear(), today.getMonth() + currentMonthIndex, 1);
  const maxMonths = config.monthsToShow || 1;
  
  const activeStory = stories.find(s => s.id === activeStoryId) || stories[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-200">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-10 shadow-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-amber-500">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2 text-sm overflow-x-auto">
             <button onClick={() => setActiveTab('requests')} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'requests' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}>
                <Inbox size={16}/> Requests
                {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {pendingRequests.length}
                    </span>
                )}
             </button>
             <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}><Calendar size={16}/> Calendar</button>
             <button onClick={() => setActiveTab('stories')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'stories' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}><Book size={16}/> Stories</button>
             <button onClick={() => setActiveTab('shoutouts')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'shoutouts' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}><Megaphone size={16}/> Codes</button>
             <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}><Settings size={16}/> Config</button>
             <button onClick={() => setActiveTab('copylist')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'copylist' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}><ClipboardList size={16}/> Copy List</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
             <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pending Requests ({pendingRequests.length})</h2>
                    <select 
                        value={activeStoryId} 
                        onChange={(e) => setActiveStoryId(e.target.value)}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                    >
                        {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                </div>

                {pendingRequests.length === 0 && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                        <Inbox size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500">No pending requests for this story.</p>
                    </div>
                )}

                {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-sm font-mono">{req.dateStr}</span>
                                    {req.authorName}
                                </h3>
                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-4">
                                    <a href={`mailto:${req.email}`} className="flex items-center gap-1 hover:text-blue-500"><Inbox size={14}/> {req.email}</a>
                                    <a href={req.storyLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-500"><ExternalLink size={14}/> View Story</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => approveRequest(req)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition-colors">
                                    <Check size={16}/> Approve
                                </button>
                                <button onClick={() => rejectRequest(req)} className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg font-bold text-sm transition-colors">
                                    <X size={16}/> Reject
                                </button>
                            </div>
                        </div>
                        <div className="p-4 grid md:grid-cols-2 gap-4">
                            <div className="text-xs">
                                <span className="font-bold text-slate-500 uppercase block mb-1">Submitted Code</span>
                                <textarea readOnly value={req.shoutoutCode} className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded p-2 font-mono text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="text-xs">
                                <span className="font-bold text-slate-500 uppercase block mb-1">Preview</span>
                                <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 p-2">
                                    <PreviewBox html={req.shoutoutCode} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        )}
        
        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-4">Global Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Months to Display</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  name="monthsToShow"
                  value={config.monthsToShow}
                  onChange={handleConfigChange}
                  className="w-32 p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Email Test (uses server script)</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Enter an email and click send to trigger the same test script the server uses.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={emailTestTarget}
                    onChange={(e) => setEmailTestTarget(e.target.value)}
                    className="flex-1 p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!emailTestTarget) {
                        alert('Enter an email address first.');
                        return;
                      }
                      const url = `/shoutouts/api/email-test.php?send=1&to=${encodeURIComponent(emailTestTarget)}`;
                      window.open(url, '_blank');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-bold"
                  >
                    Send Test Email
                  </button>
                </div>
              </div>
              
              <div className="pt-8 border-t dark:border-slate-800 mt-8">
                  <h3 className="text-red-600 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
                  <button onClick={() => { if(confirm('Reset entire DB?')) db.resetDatabase() }} className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                      <RefreshCw size={16} /> Reset Database
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* STORIES TAB */}
        {activeTab === 'stories' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Stories</h2>
                <button 
                    onClick={addStory}
                    className="flex items-center gap-2 bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-amber-400"
                >
                    <Plus size={18} /> New Story
                </button>
             </div>
             
             {stories.map((s) => (
                <div key={s.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative">
                     <button onClick={() => deleteStory(s.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                        <Trash2 size={20} />
                    </button>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Title</label>
                                 <input 
                                    value={s.title}
                                    onChange={(e) => handleStoryChange(s.id, 'title', e.target.value)}
                                    className="w-full font-semibold text-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Link</label>
                                 <input 
                                    value={s.link}
                                    onChange={(e) => handleStoryChange(s.id, 'link', e.target.value)}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-2 focus:ring-2 focus:ring-amber-500 outline-none text-blue-500"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cover Image URL</label>
                                 <input 
                                    value={s.coverImage}
                                    onChange={(e) => handleStoryChange(s.id, 'coverImage', e.target.value)}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Theme Color</label>
                                 <div className="flex gap-2">
                                     {COLORS.map(c => (
                                         <button 
                                            key={c}
                                            onClick={() => handleStoryChange(s.id, 'color', c)}
                                            className={`w-8 h-8 rounded-full border-2 ${s.color === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'} transition-transform bg-${c}-500`}
                                            style={{ backgroundColor: `var(--color-${c}-500)` /* fallback */ }} 
                                         >
                                             <div className={`w-full h-full rounded-full bg-${c}-500 opacity-80`} />
                                         </button>
                                     ))}
                                 </div>
                             </div>
                        </div>
                        <div className="flex justify-center items-start">
                            <div className="w-32 h-48 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                                <img src={s.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
             ))}
          </div>
        )}

        {/* SHOUTOUTS TAB */}
        {activeTab === 'shoutouts' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Shoutout Codes</h2>
                <button 
                    onClick={addShoutout}
                    className="flex items-center gap-2 bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-amber-400"
                >
                    <Plus size={18} /> Add Code
                </button>
             </div>
             
             {shoutouts.map((s) => (
                <div key={s.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between mb-4 gap-4">
                        <div className="flex-1">
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Label</label>
                             <input 
                                value={s.label}
                                onChange={(e) => handleShoutoutChange(s.id, 'label', e.target.value)}
                                className="w-full font-semibold text-lg bg-transparent border-b border-slate-300 dark:border-slate-700 dark:text-white focus:border-amber-500 outline-none pb-1"
                             />
                        </div>
                         <div className="w-48">
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Assigned Story</label>
                             <select
                                value={s.storyId || ''}
                                onChange={(e) => handleShoutoutChange(s.id, 'storyId', e.target.value)}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                             >
                                 <option value="">All Stories (Global)</option>
                                 {stories.map(story => (
                                     <option key={story.id} value={story.id}>{story.title}</option>
                                 ))}
                             </select>
                         </div>
                        <button onClick={() => deleteShoutout(s.id)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 self-end mb-1">
                            <Trash2 size={20} />
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">HTML Code</label>
                             <textarea 
                                value={s.code}
                                onChange={(e) => handleShoutoutChange(s.id, 'code', e.target.value)}
                                className="w-full h-40 p-3 font-mono text-sm bg-slate-50 dark:bg-slate-950 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                             />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Preview</label>
                            <PreviewBox html={s.code} />
                        </div>
                    </div>
                </div>
             ))}
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Managing Availability For:</label>
                    <div className="relative">
                        <select 
                            value={activeStoryId} 
                            onChange={(e) => setActiveStoryId(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-lg font-bold py-2 pl-4 pr-10 rounded-lg cursor-pointer focus:ring-2 focus:ring-amber-500 outline-none w-full md:w-auto"
                        >
                            {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button 
                    onClick={() => setCurrentMonthIndex(i => Math.max(0, i - 1))}
                    disabled={currentMonthIndex <= 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold min-w-[100px] text-center">Month {currentMonthIndex + 1}/{maxMonths}</span>
                    <button 
                    onClick={() => setCurrentMonthIndex(i => Math.min(maxMonths - 1, i + 1))}
                    disabled={currentMonthIndex >= maxMonths - 1}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <ChevronRight size={20} />
                    </button>
                 </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-lg mb-8 text-sm flex gap-4">
                <div className="flex-1">
                    <p>Click dates to toggle availability for <strong>{activeStory.title}</strong>.</p>
                </div>
                <div className="flex gap-4 items-center text-xs font-bold uppercase">
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-500 rounded-sm"></span> Available</span>
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-sm"></span> Pending</span>
                     <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 border border-slate-500 rounded-sm"></span> Booked</span>
                </div>
            </div>

            <MonthView
              year={currentViewDate.getFullYear()}
              month={currentViewDate.getMonth()}
              availableDates={availableDates}
              bookedDates={bookedDates}
              pendingDates={pendingDates}
              onDateClick={toggleDateAvailability}
              isAdminMode={true}
              color={activeStory.color}
            />
          </div>
        )}

        {/* COPY LIST TAB */}
        {activeTab === 'copylist' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Shoutout Copy List ({approvedBookings.length})</h2>
                <select 
                    value={activeStoryId} 
                    onChange={(e) => setActiveStoryId(e.target.value)}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                >
                    {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm">
                <p>Quick copy list of all approved shoutout codes, sorted by date. Past dates are grayed out.</p>
            </div>

            {approvedBookings.length === 0 && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                    <ClipboardList size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500">No approved bookings yet.</p>
                </div>
            )}

            <div className="space-y-2">
                {approvedBookings.map(booking => {
                    const bookingDate = new Date(booking.dateStr + 'T00:00:00');
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const isPast = bookingDate < todayStart;
                    
                    return (
                        <div 
                            key={booking.id} 
                            className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden ${isPast ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-4 p-4">
                                <div className={`font-mono text-sm px-3 py-1 rounded ${isPast ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'}`}>
                                    {booking.dateStr}
                                </div>
                                <div className="flex-1">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{booking.authorName}</span>
                                    <a href={booking.storyLink} target="_blank" rel="noreferrer" className="ml-2 text-blue-500 hover:text-blue-600 text-sm">
                                        <ExternalLink size={14} className="inline" />
                                    </a>
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(booking.shoutoutCode);
                                        alert('Code copied to clipboard!');
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                                        isPast 
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' 
                                        : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                                    }`}
                                >
                                    <Copy size={16}/> Copy Code
                                </button>
                                <button 
                                    onClick={() => deleteApprovedBooking(booking)}
                                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    title="Delete this shoutout"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                            <div className="px-4 pb-4">
                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs font-mono text-slate-500 dark:text-slate-400 max-h-20 overflow-y-auto whitespace-pre-wrap">
                                    {booking.shoutoutCode}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
