import { projectId, publicAnonKey } from './supabase/info';
import { smartApi } from './smartApi';
import { supabase } from './supabase/client';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d9b92013`;

// Helper to convert camelCase (backend) to snake_case (current UI format)
const toSnakeCase = (obj: any): any => {
  if (!obj) return obj;
  return {
    donation_id: obj.donationId,
    donor_id: obj.donorId,
    item_name: obj.itemName,
    category: obj.category,
    quantity: obj.quantity,
    status: obj.status,
    created_at: obj.createdAt,
    description: obj.description,
    location: obj.location,
  };
};

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'donor' | 'organization' | 'admin';
  organization?: Organization;
}

export interface Organization {
  orgId: number;
  userId: number;
  orgName: string;
  contactInfo: string;
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
  donation_item?: string;
  request_item?: string;
  donor_name?: string;
  donor_email?: string;
  org_name?: string;
  org_contact_info?: string;
  donation_status?: string;
  request_status?: string;
  donation_quantity?: number;
  request_quantity?: number;
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
    try {
      // Step 1: Create user in MySQL FIRST (bypass Supabase Auth for now)
      console.log('📝 Creating user in MySQL...');
      const mysqlUser = await smartApi.createUser({
        name: data.name,
        email: data.email,
        passwordHash: data.password, // In production, this should be hashed
        role: data.role as 'donor' | 'organization' | 'admin',
      });

      console.log('✅ User created in MySQL with ID:', mysqlUser.userId);

      // Step 2: Try to create in Supabase Auth (optional for now)
      console.log('📝 Attempting Supabase Auth creation...');
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: undefined,
            data: {
              name: data.name,
              role: data.role,
            }
          }
        });

        if (authError) {
          console.warn('⚠️ Supabase Auth failed (continuing anyway):', authError.message);
        } else {
          console.log('✅ Supabase Auth user created');
        }
      } catch (authErr) {
        console.warn('⚠️ Supabase Auth error (continuing anyway):', authErr);
      }

      // Step 3: If organization, create organization record
      if (data.role === 'organization') {
        console.log('📝 Creating organization record...');
        await smartApi.createOrganization({
          userId: mysqlUser.userId,
          orgName: data.orgName || data.name,
          contactInfo: data.contactInfo || `Contact: ${data.email}`,
        });
        console.log('✅ Organization record created');
      }

      return {
        mysqlUserId: mysqlUser.userId,
        email: data.email,
        name: data.name,
        role: data.role,
      };
    } catch (error: any) {
      console.error('❌ Signup failed:', error);
      throw new Error(error.message || 'Signup failed');
    }
  }

  async getCurrentUser(token: string): Promise<User> {
    try {
      // Get auth user from Supabase
      console.log('🔍 Getting user from Supabase Auth...');
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      
      if (error || !authUser) {
        console.error('❌ Supabase Auth error:', error);
        throw new Error('Failed to get authenticated user');
      }

      console.log('✅ Supabase Auth user found:', authUser.email);

      // Get user details from MySQL
      console.log('📖 Fetching user details from MySQL by email:', authUser.email);
      const users = await smartApi.getUserByEmail(authUser.email!);
      
      console.log('📊 MySQL response:', users);
      
      if (!users || users.length === 0) {
        console.error('❌ User not found in MySQL for email:', authUser.email);
        throw new Error('User not found in database. Please sign up again.');
      }

      const mysqlUser = users[0];
      console.log('✅ MySQL user found:', mysqlUser);

      // For organization users, also fetch organization data
      let organization = null;
      if (mysqlUser.role === 'organization') {
        try {
          organization = await smartApi.getOrganizationByUserId(mysqlUser.userId);
          console.log('✅ Organization data found:', organization);
        } catch (orgError) {
          console.warn('⚠️ Could not fetch organization data:', orgError);
        }
      }

      // Convert to UI format
      return {
        user_id: mysqlUser.userId,
        email: mysqlUser.email,
        name: mysqlUser.name,
        role: mysqlUser.role,
        organization: organization,
      };
    } catch (error: any) {
      console.error('❌ Failed to get current user:', error);
      throw new Error(error.message || 'Failed to fetch user');
    }
  }

  // Donations
  async createDonation(token: string, data: {
    item_name: string;
    category: string;
    quantity: number;
  }): Promise<Donation> {
    // Get user info from token
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');
    
    // Get donor_id from MySQL users table by email
    const users = await smartApi.getUserByEmail(user.email!);
    if (!users || users.length === 0) {
      throw new Error('User not found in database. Please sign up again.');
    }
    
    const donorId = users[0].userId;
    
    // Call smartApi with camelCase
    const result = await smartApi.createDonation({
      donorId,
      itemName: data.item_name,
      category: data.category,
      quantity: data.quantity,
    });
    
    // Convert back to snake_case for UI
    return toSnakeCase(result);
  }

  async getDonations(status?: string): Promise<Donation[]> {
    // Use smartApi which handles MySQL -> Supabase fallback
    const results = await smartApi.getDonations(status ? { status } : undefined);
    
    // Convert from camelCase to snake_case for UI
    return results.map(toSnakeCase);
  }

  async getMyDonations(token: string): Promise<Donation[]> {
    // Get current user to find their donor_id
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');
    
    // Get donor_id from MySQL
    const users = await smartApi.getUserByEmail(user.email!);
    if (!users || users.length === 0) {
      throw new Error('User not found in database');
    }
    
    const donorId = users[0].userId;
    
    // Fetch donations for this donor from MySQL
    const results = await smartApi.getDonations({ donorId });
    
    // Convert to snake_case for UI
    return results.map(toSnakeCase);
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
    // Use smartApi - deletes from MySQL (which removes from Supabase too)
    await smartApi.deleteDonation(id);
  }

  // Requests
  async createRequest(token: string, data: {
    item_name: string;
    category: string;
    quantity: number;
  }): Promise<Request> {
    // Get current user (organization)
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');
    
    // Get user details from MySQL
    const users = await smartApi.getUserByEmail(user.email!);
    if (!users || users.length === 0) {
      throw new Error('User not found in database');
    }
    
    const userId = users[0].userId;
    
    // Get org_id from organizations table
    const org = await smartApi.getOrganizationByUserId(userId);
    if (!org) {
      throw new Error('Organization not found. Please contact support.');
    }
    
    // Create request via smartApi
    const result = await smartApi.createRequest({
      orgId: org.orgId,
      itemName: data.item_name,
      category: data.category,
      quantity: data.quantity,
    });
    
    // Convert to UI format (snake_case)
    return {
      request_id: result.requestId,
      org_id: result.orgId,
      item_name: result.itemName,
      category: result.category,
      quantity: result.quantity,
      status: result.status,
      created_at: result.createdAt,
    };
  }

  async getRequests(status?: string): Promise<Request[]> {
    // Fetch requests from MySQL via smartApi
    const requests = await smartApi.getRequests(status ? { status } : undefined);
    
    // Convert to UI format (snake_case)
    return requests.map((r: any) => ({
      request_id: r.requestId,
      org_id: r.orgId,
      item_name: r.itemName,
      category: r.category,
      quantity: r.quantity,
      status: r.status,
      description: r.description,
      urgency: r.urgency,
      created_at: r.createdAt,
      organizations_d9b92013: r.orgName ? {
        org_name: r.orgName,
        contact_info: r.contactInfo,
      } : undefined,
    }));
  }

  async getMyRequests(token: string): Promise<Request[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');
    
    // Get user details from MySQL
    const users = await smartApi.getUserByEmail(user.email!);
    if (!users || users.length === 0) {
      throw new Error('User not found in database');
    }
    
    const userId = users[0].userId;
    
    // Get org_id from organizations table
    const org = await smartApi.getOrganizationByUserId(userId);
    if (!org) {
      throw new Error('Organization not found. Please contact support.');
    }
    
    // Fetch ACTIVE requests for this organization (exclude fulfilled/cancelled)
    const allRequests = await smartApi.getRequests({ orgId: org.orgId });
    const activeRequests = allRequests.filter((r: any) => 
      r.status === 'open' || r.status === 'matched'
    );
    
    // Convert to UI format (snake_case)
    return activeRequests.map((r: any) => ({
      request_id: r.requestId,
      org_id: r.orgId,
      item_name: r.itemName,
      category: r.category,
      quantity: r.quantity,
      status: r.status,
      description: r.description,
      urgency: r.urgency,
      created_at: r.createdAt,
    }));
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
    // Delete request via smartApi (MySQL with Supabase sync)
    await smartApi.deleteRequest(id);
  }

  // Matches
  async getMyMatches(token: string): Promise<Match[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');
    
    // Get user details from MySQL
    const users = await smartApi.getUserByEmail(user.email!);
    if (!users || users.length === 0) {
      throw new Error('User not found in database');
    }
    
    const userId = users[0].userId;
    const userRole = users[0].role;
    
    // Fetch matches based on role
    let filters;
    if (userRole === 'donor') {
      filters = { donorId: userId };
    } else if (userRole === 'organization') {
      // Get org_id from organizations table (not user_id!)
      const org = await smartApi.getOrganizationByUserId(userId);
      if (!org) {
        throw new Error('Organization not found');
      }
      filters = { orgId: org.orgId };
    } else {
      filters = {}; // admin or other
    }
    
    const matches = await smartApi.getMatches(filters);
    
    // Debug: Log raw match data from backend
    console.log('🔍 Raw matches from backend:', matches);
    
    // Convert to UI format (snake_case) with all details
    const convertedMatches = matches.map((m: any) => {
      const converted = {
        match_id: m.matchId,
        donation_id: m.donationId,
        request_id: m.requestId,
        match_date: m.matchDate,
        status: m.status || 'pending',
        donation_item: m.donationItem,
        request_item: m.requestItem,
        donor_name: m.donorName,
        donor_email: m.donorEmail,
        org_name: m.orgName,
        org_contact_info: m.orgContactInfo,
        donation_status: m.donationStatus,
        request_status: m.requestStatus,
        donation_quantity: m.donationQuantity ?? null,
        request_quantity: m.requestQuantity ?? null,
      };
      console.log('🔄 Converted match:', {
        match_id: converted.match_id,
        donationQuantity: m.donationQuantity,
        requestQuantity: m.requestQuantity,
        converted_donation_quantity: converted.donation_quantity,
        converted_request_quantity: converted.request_quantity,
      });
      return converted;
    });
    
    return convertedMatches;
  }

  async acceptRequest(token: string, requestId: number): Promise<Match> {
    // Get current user (donor)
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');
    
    // Get user details from MySQL
    const users = await smartApi.getUserByEmail(user.email!);
    if (!users || users.length === 0) {
      throw new Error('User not found in database');
    }
    
    const donorId = users[0].userId;
    
    // Create match via smartApi (donor accepts request to fulfill)
    const match = await smartApi.acceptRequest({
      donorId,
      requestId,
    });
    
    // Convert to UI format with all match details
    return {
      match_id: match.matchId,
      donation_id: match.donationId,
      request_id: match.requestId,
      match_date: match.matchDate,
      status: match.status || 'pending',
      donation_item: match.donationItem,
      request_item: match.requestItem,
      donor_name: match.donorName,
      donor_email: match.donorEmail,
      org_name: match.orgName,
      org_contact_info: match.orgContactInfo,
      donation_status: match.donationStatus,
      request_status: match.requestStatus,
      donation_quantity: match.donationQuantity,
      request_quantity: match.requestQuantity,
    };
  }

  async createMatch(token: string, data: { donation_id: number; request_id?: number }): Promise<Match> {
    // Get current user (organization)
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');
    
    // Get user details from MySQL
    const users = await smartApi.getUserByEmail(user.email!);
    if (!users || users.length === 0) {
      throw new Error('User not found in database');
    }
    
    const userId = users[0].userId;
    
    // Get org_id from organizations table
    const org = await smartApi.getOrganizationByUserId(userId);
    if (!org) {
      throw new Error('Organization not found. Please contact support.');
    }
    
    // Create match via smartApi
    const match = await smartApi.createMatch({
      donationId: data.donation_id,
      orgId: org.orgId,
      requestId: data.request_id,
    });
    
    // Convert to UI format
    return {
      match_id: match.matchId,
      donation_id: match.donationId,
      request_id: match.requestId,
      match_date: match.matchDate,
      status: match.status || 'pending',
      donation_quantity: match.donationQuantity,
      request_quantity: match.requestQuantity,
    };
  }

  async updateMatchStatus(token: string, matchId: number, status: string): Promise<Match> {
    const match = await smartApi.updateMatch(matchId, { status });
    
    // Convert to UI format
    return {
      match_id: match.matchId,
      donation_id: match.donationId,
      request_id: match.requestId,
      match_date: match.matchDate,
      status: match.status,
      donation_quantity: match.donationQuantity,
      request_quantity: match.requestQuantity,
    };
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