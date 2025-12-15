import { AdminConfig, AdminShoutout, Booking, Story, BookingStatus } from '../types';

// API Base URL - integrated into main site
const API_BASE_URL = '/api/shoutouts';

class ShoutoutsApiService {
  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'same-origin', // Include cookies for JWT authentication
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // --- CONFIG ---
  async getConfig(): Promise<AdminConfig> {
    return this.fetchApi('/config.php');
  }

  async updateConfig(config: AdminConfig): Promise<void> {
    await this.fetchApi('/config.php', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // --- STORIES ---
  async getStories(): Promise<Story[]> {
    return this.fetchApi('/stories.php');
  }

  async getStory(id: string): Promise<Story | undefined> {
    try {
      return await this.fetchApi(`/stories.php?id=${encodeURIComponent(id)}`);
    } catch {
      return undefined;
    }
  }

  async upsertStory(story: Story): Promise<void> {
    await this.fetchApi('/stories.php', {
      method: 'POST',
      body: JSON.stringify(story),
    });
  }

  async deleteStory(id: string): Promise<void> {
    await this.fetchApi(`/stories.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // --- ADMIN SHOUTOUTS (Templates) ---
  async getAdminShoutouts(storyId?: string): Promise<AdminShoutout[]> {
    const url = storyId 
      ? `/shoutouts.php?storyId=${encodeURIComponent(storyId)}`
      : '/shoutouts.php';
    return this.fetchApi(url);
  }

  async upsertAdminShoutout(shoutout: AdminShoutout): Promise<void> {
    await this.fetchApi('/shoutouts.php', {
      method: 'POST',
      body: JSON.stringify(shoutout),
    });
  }

  async deleteAdminShoutout(id: string): Promise<void> {
    await this.fetchApi(`/shoutouts.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // --- AVAILABILITY ---
  async getAvailability(storyId: string): Promise<string[]> {
    return this.fetchApi(`/availability.php?storyId=${encodeURIComponent(storyId)}`);
  }

  async setAvailability(storyId: string, dateStr: string, isAvailable: boolean): Promise<void> {
    await this.fetchApi('/availability.php', {
      method: 'POST',
      body: JSON.stringify({ storyId, dateStr, isAvailable }),
    });
  }

  // --- BOOKINGS ---
  async getBookings(storyId?: string): Promise<Booking[]> {
    const url = storyId 
      ? `/bookings.php?storyId=${encodeURIComponent(storyId)}`
      : '/bookings.php';
    return this.fetchApi(url);
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> {
    return this.fetchApi('/bookings.php', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<{ emailSent?: any }> {
    const result = await this.fetchApi('/bookings.php', {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    });
    
    // Log email debug info if available
    if (result.emailSent) {
      console.log('📧 Email Result:', result.emailSent);
    }
    
    return result;
  }

  async deleteBooking(id: string): Promise<void> {
    await this.fetchApi(`/bookings.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // --- ADMIN UTILITIES ---
  async resetDatabase(): Promise<void> {
    // Note: This should be implemented on the backend if needed
    // For now, this is a placeholder that could trigger a reset endpoint
    console.warn('resetDatabase called - backend implementation required');
    throw new Error('Database reset is not implemented in the API');
  }
}

export const db = new ShoutoutsApiService();
