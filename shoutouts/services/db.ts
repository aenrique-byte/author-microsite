
import { DbSchema, AdminConfig, AdminShoutout, Availability, Booking, Story, BookingStatus } from '../types';

const DB_KEY = 'rr_shoutout_db_v2';

const DEFAULT_CONFIG: AdminConfig = {
  monthsToShow: 3,
};

const DEFAULT_STORY: Story = {
  id: 'default',
  title: 'My Royal Road Story',
  link: 'https://www.royalroad.com/fiction/12345/my-story',
  coverImage: 'https://picsum.photos/400/600',
  color: 'amber'
};

const DEFAULT_DB: DbSchema = {
  config: DEFAULT_CONFIG,
  stories: [DEFAULT_STORY],
  adminShoutouts: [
    {
      id: '1',
      label: 'Main Shoutout',
      code: '<div style="border: 1px solid #ccc; padding: 10px;"><strong>My Story</strong><br><a href="#">Read Now</a></div>',
      storyId: 'default'
    },
  ],
  availability: [],
  bookings: [],
};

// Simple "SQL-like" wrapper around LocalStorage
export class DatabaseService {
  private load(): DbSchema {
    const data = localStorage.getItem(DB_KEY);
    
    // Migration from v1 to v2 if needed (basic check)
    if (!data) {
        // Check for v1 data
        const oldData = localStorage.getItem('rr_shoutout_db_v1');
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                // Migrate
                const newDb: DbSchema = {
                    config: { monthsToShow: parsed.config.monthsToShow || 3 },
                    stories: [{
                        id: 'default',
                        title: parsed.config.storyTitle || DEFAULT_STORY.title,
                        link: parsed.config.storyLink || DEFAULT_STORY.link,
                        coverImage: parsed.config.coverImage || DEFAULT_STORY.coverImage,
                        color: 'amber'
                    }],
                    adminShoutouts: parsed.adminShoutouts.map((s: any) => ({ ...s, storyId: 'default' })),
                    availability: parsed.availability.map((a: any) => ({ ...a, storyId: 'default' })),
                    bookings: parsed.bookings.map((b: any) => ({ 
                        ...b, 
                        storyId: 'default',
                        status: 'approved', // Default old bookings to approved
                        email: ''
                    })),
                };
                this.save(newDb);
                return newDb;
            } catch (e) {
                console.error('Migration failed', e);
            }
        }

        this.save(DEFAULT_DB);
        return DEFAULT_DB;
    }
    
    try {
      const parsed = JSON.parse(data);
      // Runtime migration for existing v2 data that might lack status/email
      if (parsed.bookings && parsed.bookings.some((b: any) => !b.status)) {
          parsed.bookings = parsed.bookings.map((b: any) => ({
              ...b,
              status: b.status || 'approved',
              email: b.email || ''
          }));
          this.save(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Database corruption detected, resetting.', e);
      return DEFAULT_DB;
    }
  }

  private save(data: DbSchema): void {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  // --- CONFIG ---
  getConfig(): AdminConfig {
    return this.load().config;
  }

  updateConfig(newConfig: Partial<AdminConfig>): void {
    const db = this.load();
    db.config = { ...db.config, ...newConfig };
    this.save(db);
  }

  // --- STORIES ---
  getStories(): Story[] {
      return this.load().stories;
  }

  getStory(id: string): Story | undefined {
      return this.load().stories.find(s => s.id === id);
  }

  upsertStory(story: Story): void {
      const db = this.load();
      const index = db.stories.findIndex(s => s.id === story.id);
      if (index >= 0) {
          db.stories[index] = story;
      } else {
          db.stories.push(story);
      }
      this.save(db);
  }

  deleteStory(id: string): void {
      const db = this.load();
      if (db.stories.length <= 1) return; // Prevent deleting last story
      db.stories = db.stories.filter(s => s.id !== id);
      // Cleanup associated data
      db.availability = db.availability.filter(a => a.storyId !== id);
      db.bookings = db.bookings.filter(b => b.storyId !== id);
      db.adminShoutouts = db.adminShoutouts.filter(s => s.storyId !== id);
      this.save(db);
  }

  // --- SHOUTOUTS ---
  getAdminShoutouts(storyId?: string): AdminShoutout[] {
    const all = this.load().adminShoutouts;
    if (storyId) {
        return all.filter(s => !s.storyId || s.storyId === storyId);
    }
    return all;
  }

  upsertAdminShoutout(shoutout: AdminShoutout): void {
    const db = this.load();
    const index = db.adminShoutouts.findIndex((s) => s.id === shoutout.id);
    if (index >= 0) {
      db.adminShoutouts[index] = shoutout;
    } else {
      db.adminShoutouts.push(shoutout);
    }
    this.save(db);
  }

  deleteAdminShoutout(id: string): void {
    const db = this.load();
    db.adminShoutouts = db.adminShoutouts.filter((s) => s.id !== id);
    this.save(db);
  }

  // --- AVAILABILITY ---
  getAvailability(storyId: string): string[] {
    return this.load().availability
        .filter(a => a.storyId === storyId)
        .map((a) => a.dateStr);
  }

  setAvailability(storyId: string, dateStr: string, isAvailable: boolean): void {
    const db = this.load();
    if (isAvailable) {
      if (!db.availability.some((a) => a.dateStr === dateStr && a.storyId === storyId)) {
        db.availability.push({ dateStr, storyId });
      }
    } else {
      db.availability = db.availability.filter((a) => !(a.dateStr === dateStr && a.storyId === storyId));
    }
    this.save(db);
  }

  // --- BOOKINGS ---
  getBookings(storyId?: string): Booking[] {
    const all = this.load().bookings;
    if (storyId) return all.filter(b => b.storyId === storyId);
    return all;
  }

  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
    const db = this.load();
    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
      status: 'pending', // Default to pending
    };
    db.bookings.push(newBooking);
    this.save(db);
    return newBooking;
  }

  updateBookingStatus(id: string, status: BookingStatus): void {
      const db = this.load();
      const idx = db.bookings.findIndex(b => b.id === id);
      if (idx >= 0) {
          db.bookings[idx].status = status;
          this.save(db);
      }
  }

  deleteBooking(id: string): void {
      const db = this.load();
      db.bookings = db.bookings.filter(b => b.id !== id);
      this.save(db);
  }
  
  // Admin Helper to clear database
  resetDatabase() {
      this.save(DEFAULT_DB);
      window.location.reload();
  }
}

export const db = new DatabaseService();
