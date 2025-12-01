// New API client that calls your Node.js backend
const API_BASE_URL = 'http://localhost:5001/api';

export interface Donation {
  donationId: number;
  donorId: number;
  itemName: string;
  category: string;
  quantity: number;
  status: 'available' | 'matched' | 'delivered' | 'cancelled';
  description?: string;
  location?: string;
  createdAt: string;
  donorName?: string;
  donorEmail?: string;
}

export interface Request {
  requestId: number;
  orgId: number;
  itemName: string;
  category: string;
  quantity: number;
  status: 'open' | 'matched' | 'fulfilled' | 'cancelled';
  description?: string;
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
}

export interface BackendUser {
  userId: number;
  name: string;
  email: string;
  role: 'donor' | 'organization' | 'admin';
  createdAt?: string;
}

class BackendApiClient {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  // ============================================
  // USERS - MySQL with Supabase sync
  // ============================================
  
  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'donor' | 'organization' | 'admin';
  }) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    
    const result = await response.json();
    return result.data; // Returns { userId, name, email, role }
  }

  async getUserByEmail(email: string) {
    const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    
    const result = await response.json();
    return result.data;
  }

  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const result = await response.json();
    return result.data;
  }

  async getOrganizationByUserId(userId: number) {
    const response = await fetch(`${API_BASE_URL}/organizations?userId=${userId}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch organization');
    }
    
    const result = await response.json();
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  async createOrganization(data: {
    userId: number;
    orgName: string;
    contactInfo: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create organization');
    }
    
    const result = await response.json();
    return result.data;
  }

  // ============================================
  // DONATIONS - Uses MySQL with Supabase sync
  // ============================================
  
  async getDonations(filters?: { status?: string; category?: string; donorId?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.donorId) params.append('donorId', filters.donorId.toString());
    
    const url = `${API_BASE_URL}/donations${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) {
      throw new Error('Failed to fetch donations');
    }
    
    const result = await response.json();
    return result.data; // Backend returns { success: true, data: [...] }
  }

  async createDonation(data: {
    donorId: number;
    itemName: string;
    category: string;
    quantity: number;
    description?: string;
    location?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create donation');
    }
    
    const result = await response.json();
    return result.data;
  }

  async updateDonation(id: number, data: Partial<Donation>) {
    const response = await fetch(`${API_BASE_URL}/donations/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update donation');
    }
    
    const result = await response.json();
    return result.data;
  }

  async deleteDonation(id: number) {
    const response = await fetch(`${API_BASE_URL}/donations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete donation');
    }
  }

  // ============================================
  // REQUESTS
  // ============================================
  
  async getRequests(filters?: { status?: string; orgId?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.orgId) params.append('orgId', filters.orgId.toString());
    
    const url = `${API_BASE_URL}/requests${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }
    
    const result = await response.json();
    return result.data;
  }

  // ============================================
  // MATCHES
  // ============================================
  
  async getMatches(filters?: { donorId?: number; orgId?: number }) {
    const params = new URLSearchParams();
    if (filters?.donorId) params.append('donorId', filters.donorId.toString());
    if (filters?.orgId) params.append('orgId', filters.orgId.toString());
    
    const url = `${API_BASE_URL}/matches${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, { headers: this.getHeaders() });
    
    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }
    
    const result = await response.json();
    return result.data;
  }

  async createMatch(data: {
    donationId: number;
    orgId: number;
    requestId?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/matches`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create match');
    }
    
    const result = await response.json();
    return result.data;
  }

  async updateMatch(id: number, data: { status?: string }) {
    const response = await fetch(`${API_BASE_URL}/matches/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update match');
    }
    
    const result = await response.json();
    return result.data;
  }
}

export const backendApi = new BackendApiClient();