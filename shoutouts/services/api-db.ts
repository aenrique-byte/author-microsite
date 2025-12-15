import { AdminConfig, AdminShoutout, Availability, Booking, Story, BookingStatus } from '../types';

// API Base URL - configured for subfolder deployment at ocwanderer.com/shoutouts
const API_BASE_URL = '/shoutouts/api';

class ApiDatabaseService {
  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // --- CONFIG ---
  async getConfig(): Promise<AdminConfig> {
    return this.fetchApi('/config.endpoint.php');
  }

  async updateConfig(newConfig: Partial<AdminConfig>): Promise<void> {
    await this.fetchApi('/config.endpoint.php', {
      method: 'PUT',
      body: JSON.stringify(newConfig),
    });
  }

  // --- STORIES ---
  async getStories(): Promise<Story[]> {
    return this.fetchApi('/stories.endpoint.php');
  }

  async getStory(id: string): Promise<Story | undefined> {
    try {
      return await this.fetchApi(`/stories.endpoint.php?id=${encodeURIComponent(id)}`);
    } catch {
      return undefined;
    }
  }

  async upsertStory(story: Story): Promise<void> {
    await this.fetchApi('/stories.endpoint.php', {
      method: 'POST',
      body: JSON.stringify(story),
    });
  }

  async deleteStory(id: string): Promise<void> {
    await this.fetchApi(`/stories.endpoint.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // --- SHOUTOUTS ---
  async getAdminShoutouts(storyId?: string): Promise<AdminShoutout[]> {
    const url = storyId 
      ? `/shoutouts.endpoint.php?storyId=${encodeURIComponent(storyId)}`
      : '/shoutouts.endpoint.php';
    return this.fetchApi(url);
  }

  async upsertAdminShoutout(shoutout: AdminShoutout): Promise<void> {
    await this.fetchApi('/shoutouts.endpoint.php', {
      method: 'POST',
      body: JSON.stringify(shoutout),
    });
  }

  async deleteAdminShoutout(id: string): Promise<void> {
    await this.fetchApi(`/shoutouts.endpoint.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // --- AVAILABILITY ---
  async getAvailability(storyId: string): Promise<string[]> {
    return this.fetchApi(`/availability.endpoint.php?storyId=${encodeURIComponent(storyId)}`);
  }

  async setAvailability(storyId: string, dateStr: string, isAvailable: boolean): Promise<void> {
    await this.fetchApi('/availability.endpoint.php', {
      method: 'POST',
      body: JSON.stringify({ storyId, dateStr, isAvailable }),
    });
  }

  // --- BOOKINGS ---
  async getBookings(storyId?: string): Promise<Booking[]> {
    const url = storyId 
      ? `/bookings.endpoint.php?storyId=${encodeURIComponent(storyId)}`
      : '/bookings.endpoint.php';
    return this.fetchApi(url);
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> {
    return this.fetchApi('/bookings.endpoint.php', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<{ emailDebug?: any }> {
    const result = await this.fetchApi('/bookings.endpoint.php', {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    });
    
    // Log email debug info if available
    if (result.emailDebug) {
      console.log('📧 Email Debug Info:', result.emailDebug);
    }
    if (result.emailSent) {
      console.log('📧 Email Result:', result.emailSent);
    }
    
    return result;
  }

  async deleteBooking(id: string): Promise<void> {
    await this.fetchApi(`/bookings.endpoint.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Admin Helper - not applicable for API version
  resetDatabase() {
    console.warn('resetDatabase is not available in API mode');
  }
}

export const db = new ApiDatabaseService();
