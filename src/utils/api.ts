import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d9b92013`;

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'donor' | 'organization' | 'admin';
  organization?: Organization;
}

export interface Organization {
  org_id: number;
  user_id: number;
  org_name: string;
  contact_info: string;
}

export interface Donation {
  donation_id: number;
  donor_id: number;
  item_name: string;
  category: string;
  quantity: number;
  status: 'available' | 'matched' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Request {
  request_id: number;
  org_id: number;
  item_name: string;
  category: string;
  quantity: number;
  status: 'open' | 'matched' | 'fulfilled' | 'cancelled';
  created_at: string;
  organizations_d9b92013?: { org_name: string };
}

export interface Match {
  match_id: number;
  donation_id: number;
  request_id: number;
  match_date: string;
  status?: string;
  donations_d9b92013?: Donation;
  requests_d9b92013?: Request & { organizations_d9b92013?: { org_name: string } };
}

export interface Stats {
  totalDonations: number;
  totalRequests: number;
  totalMatches: number;
  totalUsers: number;
}

class ApiClient {
  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    return headers;
  }

  async signup(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    orgName?: string;
    contactInfo?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  }

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user');
    }

    return response.json();
  }

  // Donations
  async createDonation(token: string, data: {
    item_name: string;
    category: string;
    quantity: number;
  }): Promise<Donation> {
    const response = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create donation');
    }

    return response.json();
  }

  async getDonations(status?: string): Promise<Donation[]> {
    const url = status
      ? `${API_BASE_URL}/donations?status=${status}`
      : `${API_BASE_URL}/donations`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch donations');
    }

    return response.json();
  }

  async getMyDonations(token: string): Promise<Donation[]> {
    const response = await fetch(`${API_BASE_URL}/donations/my`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch donations');
    }

    return response.json();
  }

  async updateDonation(token: string, id: number, data: Partial<Donation>): Promise<Donation> {
    const response = await fetch(`${API_BASE_URL}/donations/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update donation');
    }

    return response.json();
  }

  async deleteDonation(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/donations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete donation');
    }
  }

  // Requests
  async createRequest(token: string, data: {
    item_name: string;
    category: string;
    quantity: number;
  }): Promise<Request> {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create request');
    }

    return response.json();
  }

  async getRequests(status?: string): Promise<Request[]> {
    const url = status
      ? `${API_BASE_URL}/requests?status=${status}`
      : `${API_BASE_URL}/requests`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch requests');
    }

    return response.json();
  }

  async getMyRequests(token: string): Promise<Request[]> {
    const response = await fetch(`${API_BASE_URL}/requests/my`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch requests');
    }

    return response.json();
  }

  async updateRequest(token: string, id: number, data: Partial<Request>): Promise<Request> {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update request');
    }

    return response.json();
  }

  async deleteRequest(token: string, id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete request');
    }
  }

  // Matches
  async createMatch(token: string, data: {
    donation_id: number;
    request_id: number;
  }): Promise<Match> {
    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create match');
    }

    return response.json();
  }

  async getMatches(): Promise<Match[]> {
    const response = await fetch(`${API_BASE_URL}/matches`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch matches');
    }

    return response.json();
  }

  async getMyMatches(token: string): Promise<Match[]> {
    const response = await fetch(`${API_BASE_URL}/matches/my`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch matches');
    }

    return response.json();
  }

  async updateMatchStatus(token: string, matchId: number, status: string): Promise<Match> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update match status');
    }

    return response.json();
  }

  // Stats
  async getStats(): Promise<Stats> {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }

    return response.json();
  }
}

export const api = new ApiClient();