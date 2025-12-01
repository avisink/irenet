import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper functions for ID generation
async function getNextId(entity: string): Promise<number> {
  const counterKey = `counter:${entity}`;
  const current = await kv.get(counterKey);
  const nextId = current ? parseInt(current) + 1 : 1;
  await kv.set(counterKey, nextId.toString());
  return nextId;
}

// Helper function to get all items of a type
async function getAllByPrefix(prefix: string): Promise<any[]> {
  const items = await kv.getByPrefix(prefix);
  return items.map(item => JSON.parse(item));
}

// ========== AUTH ROUTES ==========

app.post('/make-server-d9b92013/auth/signup', async (c) => {
  try {
    const { email, password, name, role, orgName, contactInfo } = await c.req.json();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error during signup:', authError);
      return c.json({ error: `Auth error during signup: ${authError.message}` }, 400);
    }

    // Create user record in KV store
    const userId = await getNextId('users');
    const userData = {
      user_id: userId,
      name,
      email,
      password_hash: 'managed_by_supabase_auth',
      role,
      created_at: new Date().toISOString()
    };

    await kv.set(`users:${userId}`, JSON.stringify(userData));
    await kv.set(`users:email:${email}`, userId.toString());

    // If role is organization, create organization record
    if (role === 'organization' && orgName) {
      const orgId = await getNextId('organizations');
      const orgData = {
        org_id: orgId,
        user_id: userId,
        org_name: orgName,
        contact_info: contactInfo || '',
        created_at: new Date().toISOString()
      };

      await kv.set(`organizations:${orgId}`, JSON.stringify(orgData));
      await kv.set(`organizations:user:${userId}`, orgId.toString());
    }

    return c.json({ user: userData, authId: authData.user.id }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: `Server error during signup: ${error}` }, 500);
  }
});

// ========== USER ROUTES ==========

app.get('/make-server-d9b92013/users/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.error('Authorization error while fetching user:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user from KV store
    const userIdStr = await kv.get(`users:email:${user.email}`);
    if (!userIdStr) {
      return c.json({ error: 'User not found in database' }, 404);
    }

    const userDataStr = await kv.get(`users:${userIdStr}`);
    if (!userDataStr) {
      return c.json({ error: 'User data not found' }, 404);
    }

    const userData = JSON.parse(userDataStr);

    // If organization, get organization data too
    if (userData.role === 'organization') {
      const orgIdStr = await kv.get(`organizations:user:${userData.user_id}`);
      if (orgIdStr) {
        const orgDataStr = await kv.get(`organizations:${orgIdStr}`);
        if (orgDataStr) {
          userData.organization = JSON.parse(orgDataStr);
        }
      }
    }

    return c.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: `Error fetching user: ${error}` }, 500);
  }
});

// ========== DONATION ROUTES ==========

app.post('/make-server-d9b92013/donations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.error('Authorization error while creating donation:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { item_name, category, quantity } = await c.req.json();

    // Get user_id from email
    const userIdStr = await kv.get(`users:email:${user.email}`);
    if (!userIdStr) {
      return c.json({ error: 'User not found' }, 404);
    }

    const donationId = await getNextId('donations');
    const donationData = {
      donation_id: donationId,
      donor_id: parseInt(userIdStr),
      item_name,
      category,
      quantity,
      status: 'available',
      created_at: new Date().toISOString()
    };

    await kv.set(`donations:${donationId}`, JSON.stringify(donationData));
    await kv.set(`donations:user:${userIdStr}:${donationId}`, 'true');

    return c.json(donationData, 201);
  } catch (error) {
    console.error('Create donation error:', error);
    return c.json({ error: `Server error creating donation: ${error}` }, 500);
  }
});

app.get('/make-server-d9b92013/donations', async (c) => {
  try {
    const status = c.req.query('status');
    const donations = await getAllByPrefix('donations:');
    
    // Filter out index keys (ones that don't contain full donation data)
    const validDonations = donations.filter(d => d.donation_id !== undefined);
    
    if (status) {
      return c.json(validDonations.filter(d => d.status === status));
    }

    return c.json(validDonations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  } catch (error) {
    console.error('Get donations error:', error);
    return c.json({ error: `Server error fetching donations: ${error}` }, 500);
  }
});

app.get('/make-server-d9b92013/donations/my', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userIdStr = await kv.get(`users:email:${user.email}`);
    if (!userIdStr) {
      return c.json({ error: 'User not found' }, 404);
    }

    const donations = await getAllByPrefix('donations:');
    const validDonations = donations.filter(d => d.donation_id !== undefined);
    const userDonations = validDonations.filter(d => d.donor_id === parseInt(userIdStr));

    return c.json(userDonations.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  } catch (error) {
    console.error('Get my donations error:', error);
    return c.json({ error: `Server error fetching donations: ${error}` }, 500);
  }
});

app.patch('/make-server-d9b92013/donations/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const donationId = c.req.param('id');
    const updates = await c.req.json();

    const donationStr = await kv.get(`donations:${donationId}`);
    if (!donationStr) {
      return c.json({ error: 'Donation not found' }, 404);
    }

    const donation = JSON.parse(donationStr);
    const updatedDonation = { ...donation, ...updates };

    await kv.set(`donations:${donationId}`, JSON.stringify(updatedDonation));

    return c.json(updatedDonation);
  } catch (error) {
    console.error('Update donation error:', error);
    return c.json({ error: `Server error updating donation: ${error}` }, 500);
  }
});

app.delete('/make-server-d9b92013/donations/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const donationId = c.req.param('id');

    const donationStr = await kv.get(`donations:${donationId}`);
    if (!donationStr) {
      return c.json({ error: 'Donation not found' }, 404);
    }

    const donation = JSON.parse(donationStr);
    await kv.del(`donations:${donationId}`);
    await kv.del(`donations:user:${donation.donor_id}:${donationId}`);

    return c.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Delete donation error:', error);
    return c.json({ error: `Server error deleting donation: ${error}` }, 500);
  }
});

// ========== REQUEST ROUTES ==========

app.post('/make-server-d9b92013/requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { item_name, category, quantity } = await c.req.json();

    // Get user and organization
    const userIdStr = await kv.get(`users:email:${user.email}`);
    if (!userIdStr) {
      return c.json({ error: 'User not found' }, 404);
    }

    const orgIdStr = await kv.get(`organizations:user:${userIdStr}`);
    if (!orgIdStr) {
      return c.json({ error: 'Only organizations can create requests' }, 403);
    }

    const requestId = await getNextId('requests');
    const requestData = {
      request_id: requestId,
      org_id: parseInt(orgIdStr),
      item_name,
      category,
      quantity,
      status: 'open',
      created_at: new Date().toISOString()
    };

    await kv.set(`requests:${requestId}`, JSON.stringify(requestData));
    await kv.set(`requests:org:${orgIdStr}:${requestId}`, 'true');

    return c.json(requestData, 201);
  } catch (error) {
    console.error('Create request error:', error);
    return c.json({ error: `Server error creating request: ${error}` }, 500);
  }
});

app.get('/make-server-d9b92013/requests', async (c) => {
  try {
    const status = c.req.query('status');
    const requests = await getAllByPrefix('requests:');
    
    const validRequests = requests.filter(r => r.request_id !== undefined);
    
    // Enrich with organization names
    for (const request of validRequests) {
      const orgStr = await kv.get(`organizations:${request.org_id}`);
      if (orgStr) {
        const org = JSON.parse(orgStr);
        request.organizations_d9b92013 = { org_name: org.org_name };
      }
    }
    
    if (status) {
      return c.json(validRequests.filter(r => r.status === status));
    }

    return c.json(validRequests.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  } catch (error) {
    console.error('Get requests error:', error);
    return c.json({ error: `Server error fetching requests: ${error}` }, 500);
  }
});

app.get('/make-server-d9b92013/requests/my', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userIdStr = await kv.get(`users:email:${user.email}`);
    if (!userIdStr) {
      return c.json({ error: 'User not found' }, 404);
    }

    const orgIdStr = await kv.get(`organizations:user:${userIdStr}`);
    if (!orgIdStr) {
      return c.json([]);
    }

    const requests = await getAllByPrefix('requests:');
    const validRequests = requests.filter(r => r.request_id !== undefined);
    const orgRequests = validRequests.filter(r => r.org_id === parseInt(orgIdStr));

    return c.json(orgRequests.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  } catch (error) {
    console.error('Get my requests error:', error);
    return c.json({ error: `Server error fetching requests: ${error}` }, 500);
  }
});

app.patch('/make-server-d9b92013/requests/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const requestId = c.req.param('id');
    const updates = await c.req.json();

    const requestStr = await kv.get(`requests:${requestId}`);
    if (!requestStr) {
      return c.json({ error: 'Request not found' }, 404);
    }

    const request = JSON.parse(requestStr);
    const updatedRequest = { ...request, ...updates };

    await kv.set(`requests:${requestId}`, JSON.stringify(updatedRequest));

    return c.json(updatedRequest);
  } catch (error) {
    console.error('Update request error:', error);
    return c.json({ error: `Server error updating request: ${error}` }, 500);
  }
});

app.delete('/make-server-d9b92013/requests/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const requestId = c.req.param('id');

    const requestStr = await kv.get(`requests:${requestId}`);
    if (!requestStr) {
      return c.json({ error: 'Request not found' }, 404);
    }

    const request = JSON.parse(requestStr);
    await kv.del(`requests:${requestId}`);
    await kv.del(`requests:org:${request.org_id}:${requestId}`);

    return c.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    return c.json({ error: `Server error deleting request: ${error}` }, 500);
  }
});

// ========== MATCH ROUTES ==========

app.post('/make-server-d9b92013/matches', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { donation_id, request_id } = await c.req.json();

    const matchId = await getNextId('matches');
    const matchData = {
      match_id: matchId,
      donation_id,
      request_id,
      match_date: new Date().toISOString()
    };

    await kv.set(`matches:${matchId}`, JSON.stringify(matchData));
    await kv.set(`matches:donation:${donation_id}:${matchId}`, 'true');
    await kv.set(`matches:request:${request_id}:${matchId}`, 'true');

    // Update donation status to matched
    const donationStr = await kv.get(`donations:${donation_id}`);
    if (donationStr) {
      const donation = JSON.parse(donationStr);
      donation.status = 'matched';
      await kv.set(`donations:${donation_id}`, JSON.stringify(donation));
    }

    // Update request status to matched
    const requestStr = await kv.get(`requests:${request_id}`);
    if (requestStr) {
      const request = JSON.parse(requestStr);
      request.status = 'matched';
      await kv.set(`requests:${request_id}`, JSON.stringify(request));
    }

    return c.json(matchData, 201);
  } catch (error) {
    console.error('Create match error:', error);
    return c.json({ error: `Server error creating match: ${error}` }, 500);
  }
});

app.get('/make-server-d9b92013/matches', async (c) => {
  try {
    const matches = await getAllByPrefix('matches:');
    const validMatches = matches.filter(m => m.match_id !== undefined);
    
    // Enrich with donation and request data
    for (const match of validMatches) {
      const donationStr = await kv.get(`donations:${match.donation_id}`);
      if (donationStr) {
        match.donations_d9b92013 = JSON.parse(donationStr);
      }
      
      const requestStr = await kv.get(`requests:${match.request_id}`);
      if (requestStr) {
        const request = JSON.parse(requestStr);
        const orgStr = await kv.get(`organizations:${request.org_id}`);
        if (orgStr) {
          const org = JSON.parse(orgStr);
          request.organizations_d9b92013 = { org_name: org.org_name };
        }
        match.requests_d9b92013 = request;
      }
    }

    return c.json(validMatches.sort((a, b) => 
      new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    ));
  } catch (error) {
    console.error('Get matches error:', error);
    return c.json({ error: `Server error fetching matches: ${error}` }, 500);
  }
});

app.get('/make-server-d9b92013/matches/my', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userIdStr = await kv.get(`users:email:${user.email}`);
    if (!userIdStr) {
      return c.json({ error: 'User not found' }, 404);
    }

    const userDataStr = await kv.get(`users:${userIdStr}`);
    if (!userDataStr) {
      return c.json([]);
    }

    const userData = JSON.parse(userDataStr);
    const matches = await getAllByPrefix('matches:');
    const validMatches = matches.filter(m => m.match_id !== undefined);
    
    let userMatches: any[] = [];

    if (userData.role === 'donor') {
      // Get donations by this user
      const donations = await getAllByPrefix('donations:');
      const userDonations = donations.filter(d => d.donor_id === parseInt(userIdStr));
      const donationIds = userDonations.map(d => d.donation_id);
      
      userMatches = validMatches.filter(m => donationIds.includes(m.donation_id));
    } else if (userData.role === 'organization') {
      // Get requests by this organization
      const orgIdStr = await kv.get(`organizations:user:${userIdStr}`);
      if (orgIdStr) {
        const requests = await getAllByPrefix('requests:');
        const orgRequests = requests.filter(r => r.org_id === parseInt(orgIdStr));
        const requestIds = orgRequests.map(r => r.request_id);
        
        userMatches = validMatches.filter(m => requestIds.includes(m.request_id));
      }
    }

    // Enrich with donation and request data
    for (const match of userMatches) {
      const donationStr = await kv.get(`donations:${match.donation_id}`);
      if (donationStr) {
        match.donations_d9b92013 = JSON.parse(donationStr);
      }
      
      const requestStr = await kv.get(`requests:${match.request_id}`);
      if (requestStr) {
        const request = JSON.parse(requestStr);
        const orgStr = await kv.get(`organizations:${request.org_id}`);
        if (orgStr) {
          const org = JSON.parse(orgStr);
          request.organizations_d9b92013 = { org_name: org.org_name };
        }
        match.requests_d9b92013 = request;
      }
    }

    return c.json(userMatches.sort((a, b) => 
      new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    ));
  } catch (error) {
    console.error('Get my matches error:', error);
    return c.json({ error: `Server error fetching matches: ${error}` }, 500);
  }
});

// ========== STATS ROUTES ==========

app.get('/make-server-d9b92013/stats', async (c) => {
  try {
    const donations = await getAllByPrefix('donations:');
    const requests = await getAllByPrefix('requests:');
    const matches = await getAllByPrefix('matches:');
    const users = await getAllByPrefix('users:');

    const validDonations = donations.filter(d => d.donation_id !== undefined);
    const validRequests = requests.filter(r => r.request_id !== undefined);
    const validMatches = matches.filter(m => m.match_id !== undefined);
    const validUsers = users.filter(u => u.user_id !== undefined);

    return c.json({
      totalDonations: validDonations.length,
      totalRequests: validRequests.length,
      totalMatches: validMatches.length,
      totalUsers: validUsers.length
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: `Server error fetching stats: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
