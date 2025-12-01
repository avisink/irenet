import { supabase } from './supabase/client';
import { backendApi } from './backendApi';

// ============================================
// SMART API: MySQL first, Supabase fallback
// ============================================

export const smartApi = {
  // ============================================
  // USERS - Write to MySQL (auto-syncs to Supabase)
  // ============================================
  
  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'donor' | 'organization' | 'admin';
  }) {
    try {
      console.log('✍️ Creating user in MySQL...');
      const result = await backendApi.createUser(data);
      console.log('✅ User created in MySQL (auto-synced to Supabase)');
      return result;
    } catch (error) {
      console.error('❌ Failed to create user in MySQL:', error);
      throw error;
    }
  },

  async getUserByEmail(email: string) {
    try {
      console.log('📖 Fetching user from MySQL...');
      const user = await backendApi.getUserByEmail(email);
      console.log('✅ User fetched from MySQL');
      return user;
    } catch (error) {
      console.error('❌ Failed to fetch user from MySQL:', error);
      throw error;
    }
  },

  async getOrganizationByUserId(userId: number) {
    try {
      console.log('📖 Fetching organization from MySQL...');
      const org = await backendApi.getOrganizationByUserId(userId);
      console.log('✅ Organization fetched from MySQL');
      return org;
    } catch (error) {
      console.error('❌ Failed to fetch organization from MySQL:', error);
      throw error;
    }
  },

  async createOrganization(data: {
    userId: number;
    orgName: string;
    contactInfo: string;
  }) {
    try {
      console.log('✍️ Creating organization in MySQL...');
      const result = await backendApi.createOrganization(data);
      console.log('✅ Organization created in MySQL');
      return result;
    } catch (error) {
      console.error('❌ Failed to create organization:', error);
      throw error;
    }
  },
  // ============================================
  // DONATIONS
  // ============================================
  
  async getDonations(filters?: { status?: string; category?: string; donorId?: number }) {
    try {
      console.log('📖 Fetching donations from MySQL (via backend)...');
      const data = await backendApi.getDonations(filters);
      console.log('✅ MySQL read successful');
      return data;
      
    } catch (mysqlError) {
      console.warn('⚠️ MySQL failed, trying Supabase NoSQL fallback...', mysqlError);
      
      try {
        // Fallback to Supabase direct query
        let query = supabase.from('recent_donations').select('*');
        
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.donorId) query = query.eq('donor_id', filters.donorId);
        
        const { data, error } = await query;
        if (error) throw error;
        
        console.log('✅ Supabase NoSQL fallback successful');
        
        // Convert to match backend format (camelCase)
        return (data || []).map((d: any) => ({
          donationId: d.donation_id,
          donorId: d.donor_id,
          itemName: d.item_name,
          category: d.category,
          quantity: d.quantity,
          status: d.status,
          createdAt: d.created_at,
        }));
        
      } catch (supabaseError) {
        console.error('❌ Both databases failed');
        throw new Error('Failed to fetch donations from both databases');
      }
    }
  },

  async createDonation(data: {
    donorId: number;
    itemName: string;
    category: string;
    quantity: number;
    description?: string;
    location?: string;
  }) {
    try {
      console.log('✍️ Creating donation in MySQL...');
      const result = await backendApi.createDonation(data);
      console.log('✅ Donation created (MySQL auto-synced to Supabase)');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to create donation:', error);
      throw error;
    }
  },

  async updateDonation(id: number, data: any) {
    try {
      console.log('✏️ Updating donation in MySQL...');
      const result = await backendApi.updateDonation(id, data);
      console.log('✅ Donation updated');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to update donation:', error);
      throw error;
    }
  },

  async deleteDonation(id: number) {
    try {
      console.log('🗑️ Deleting donation from MySQL...');
      await backendApi.deleteDonation(id);
      console.log('✅ Donation deleted (removed from both DBs)');
      
    } catch (error) {
      console.error('❌ Failed to delete donation:', error);
      throw error;
    }
  },

  // ============================================
  // REQUESTS
  // ============================================
  
  async getRequests(filters?: { status?: string; orgId?: number }) {
    try {
      console.log('📖 Fetching requests from MySQL...');
      const data = await backendApi.getRequests(filters);
      console.log('✅ MySQL read successful');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch requests:', error);
      throw error;
    }
  },
  
  // ============================================
  // MATCHES
  // ============================================
  
  async getMatches(filters?: { donorId?: number; orgId?: number }) {
    try {
      console.log('📖 Fetching matches from MySQL...');
      const data = await backendApi.getMatches(filters);
      console.log('✅ MySQL read successful');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch matches:', error);
      throw error;
    }
  },

  async createMatch(data: {
    donationId: number;
    orgId: number;
    requestId?: number;
  }) {
    try {
      console.log('✍️ Creating match in MySQL...');
      const result = await backendApi.createMatch(data);
      console.log('✅ Match created (MySQL auto-synced to Supabase)');
      return result;
    } catch (error) {
      console.error('❌ Failed to create match:', error);
      throw error;
    }
  },

  async updateMatch(id: number, data: { status?: string }) {
    try {
      console.log('📝 Updating match in MySQL...');
      const result = await backendApi.updateMatch(id, data);
      console.log('✅ Match updated');
      return result;
    } catch (error) {
      console.error('❌ Failed to update match:', error);
      throw error;
    }
  },
};