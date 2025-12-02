const db = require('../config/database');
const { supabase } = require('../config/supabase');

// Convert database snake_case to frontend camelCase
const convertToFrontendFormat = (dbData) => {
  if (!dbData) return null;
  
  // Debug: Log the raw database data
  console.log('🔍 Raw DB data for match:', {
    match_id: dbData.match_id,
    donation_quantity: dbData.donation_quantity,
    request_quantity: dbData.request_quantity,
    donation_quantity_type: typeof dbData.donation_quantity,
    request_quantity_type: typeof dbData.request_quantity,
  });
  
  // Explicitly handle quantity fields - ensure they're always included
  const donationQty = dbData.donation_quantity !== undefined && dbData.donation_quantity !== null 
    ? Number(dbData.donation_quantity) 
    : null;
  const requestQty = dbData.request_quantity !== undefined && dbData.request_quantity !== null 
    ? Number(dbData.request_quantity) 
    : null;
  
  const converted = {
    matchId: dbData.match_id,
    donationId: dbData.donation_id,
    requestId: dbData.request_id,
    matchDate: dbData.match_date,
    status: dbData.status,
    donationItem: dbData.donation_item,
    requestItem: dbData.request_item,
    donorId: dbData.donor_id,
    orgId: dbData.org_id,
    donorName: dbData.donor_name,
    donorEmail: dbData.donor_email,
    orgName: dbData.org_name,
    orgContactInfo: dbData.org_contact_info,
    donationStatus: dbData.donation_status,
    requestStatus: dbData.request_status,
    donationQuantity: donationQty,
    requestQuantity: requestQty,
  };
  
  // Debug: Log the converted data
  console.log('✅ Converted match data:', {
    matchId: converted.matchId,
    donationQuantity: converted.donationQuantity,
    requestQuantity: converted.requestQuantity,
  });
  
  return converted;
};

// Convert frontend camelCase to database snake_case
const convertToDbFormat = (frontendData) => {
  const dbData = {};
  
  if (frontendData.donationId !== undefined) dbData.donation_id = frontendData.donationId;
  if (frontendData.requestId !== undefined) dbData.request_id = frontendData.requestId;
  if (frontendData.matchDate !== undefined) dbData.match_date = frontendData.matchDate;
  
  return dbData;
};

// Log activity to Supabase
const logActivity = async (eventType, data) => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        event_type: eventType,
        data: data,
      });
    
    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Error in activity log:', err);
  }
};

// GET /api/matches - Get all matches (with optional donorId/orgId filters)
exports.getAll = async (req, res) => {
  try {
    const { donorId, orgId } = req.query;

    let query = `
      SELECT m.*, d.item_name as donation_item, d.status as donation_status, d.quantity as donation_quantity,
             r.item_name as request_item, r.status as request_status, r.quantity as request_quantity,
             u.name as donor_name, u.email as donor_email,
             o.org_name, o.contact_info as org_contact_info
      FROM matches m
      LEFT JOIN donations d ON m.donation_id = d.donation_id
      LEFT JOIN requests r ON m.request_id = r.request_id
      LEFT JOIN users u ON m.donor_id = u.user_id
      JOIN organizations o ON m.org_id = o.org_id
    `;

    const params = [];
    const conditions = [];

    if (donorId) {
      conditions.push('m.donor_id = ?');
      params.push(donorId);
    }

    if (orgId) {
      conditions.push('m.org_id = ?');
      params.push(orgId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.match_date DESC';
    
    const [rows] = await db.query(query, params);
    
    // Debug: Log first row to see what we're getting from DB
    if (rows.length > 0) {
      console.log('🔍 First row from DB query:', {
        match_id: rows[0].match_id,
        donation_quantity: rows[0].donation_quantity,
        request_quantity: rows[0].request_quantity,
        has_donation_quantity: 'donation_quantity' in rows[0],
        has_request_quantity: 'request_quantity' in rows[0],
      });
    }
    
    const formattedData = rows.map(convertToFrontendFormat);
    
    // Debug: Log first converted item
    if (formattedData.length > 0) {
      console.log('✅ First converted item:', {
        matchId: formattedData[0].matchId,
        donationQuantity: formattedData[0].donationQuantity,
        requestQuantity: formattedData[0].requestQuantity,
        has_donationQuantity: 'donationQuantity' in formattedData[0],
        has_requestQuantity: 'requestQuantity' in formattedData[0],
      });
    }
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/matches/:id - Get match by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT m.*, d.item_name as donation_item, d.status as donation_status, d.quantity as donation_quantity,
              r.item_name as request_item, r.status as request_status, r.quantity as request_quantity,
              u.name as donor_name, u.email as donor_email,
              o.org_name, o.contact_info as org_contact_info
       FROM matches m
       LEFT JOIN donations d ON m.donation_id = d.donation_id
       LEFT JOIN requests r ON m.request_id = r.request_id
       LEFT JOIN users u ON m.donor_id = u.user_id
       JOIN organizations o ON m.org_id = o.org_id
       WHERE m.match_id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/matches/accept-request - Donor accepts a request to fulfill
exports.acceptRequest = async (req, res) => {
  try {
    const { donorId, requestId } = req.body;
    
    if (!donorId || !requestId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: donorId, requestId'
      });
    }
    
    // Get the request to find org_id
    const [requestRows] = await db.query(
      'SELECT org_id, status FROM requests WHERE request_id = ?',
      [requestId]
    );
    
    if (requestRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    if (requestRows[0].status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'Request is not available (already matched or fulfilled)'
      });
    }
    
    const orgId = requestRows[0].org_id;
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create match with donor committing to fulfill the request
      const [result] = await connection.query(
        'INSERT INTO matches (donation_id, request_id, org_id, donor_id, match_date, status) VALUES (?, ?, ?, ?, CURDATE(), ?)',
        [null, requestId, orgId, donorId, 'pending']
      );
      
      const matchId = result.insertId;
      
      // Update request status to 'matched'
      await connection.query(
        'UPDATE requests SET status = ? WHERE request_id = ?',
        ['matched', requestId]
      );
      
      // Commit transaction
      await connection.commit();
      connection.release();
      
      // Log activity to Supabase
      await logActivity('request_accepted', {
        match_id: matchId,
        donor_id: donorId,
        request_id: requestId,
        org_id: orgId,
      });
      
      // Fetch complete match data
      const [rows] = await db.query(
        `SELECT m.*, d.item_name as donation_item, d.status as donation_status, d.quantity as donation_quantity,
                r.item_name as request_item, r.status as request_status, r.quantity as request_quantity,
                u.name as donor_name, u.email as donor_email,
                o.org_name, o.contact_info as org_contact_info
         FROM matches m
         LEFT JOIN donations d ON m.donation_id = d.donation_id
         JOIN requests r ON m.request_id = r.request_id
         LEFT JOIN users u ON m.donor_id = u.user_id
         JOIN organizations o ON m.org_id = o.org_id
         WHERE m.match_id = ?`,
        [matchId]
      );
      
      const formattedData = convertToFrontendFormat(rows[0]);
      res.status(201).json({ success: true, data: formattedData });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/matches - Create match
exports.create = async (req, res) => {
  try {
    const { donationId, requestId, orgId } = req.body;
    
    if (!donationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: donationId'
      });
    }
    
    // If requestId not provided but orgId is, we can proceed
    // This allows orgs to accept donations without specific requests
    if (!requestId && !orgId) {
      return res.status(400).json({
        success: false,
        error: 'Either requestId or orgId is required'
      });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Derive donor_id from donation if available
      let donorId = null;
      if (donationId) {
        const [donorRows] = await connection.query(
          'SELECT donor_id FROM donations WHERE donation_id = ?',
          [donationId]
        );
        if (donorRows.length > 0) {
          donorId = donorRows[0].donor_id;
        }
      }

      // Create match with org_id and donor_id
      const [result] = await connection.query(
        'INSERT INTO matches (donation_id, request_id, org_id, donor_id, match_date, status) VALUES (?, ?, ?, ?, CURDATE(), ?)',
        [donationId, requestId || null, orgId, donorId, 'pending']
      );
      
      const matchId = result.insertId;
      
      // Update donation status to 'matched'
      await connection.query(
        'UPDATE donations SET status = ? WHERE donation_id = ?',
        ['matched', donationId]
      );
      
      // Update request status to 'matched' (if request exists)
      if (requestId) {
        await connection.query(
          'UPDATE requests SET status = ? WHERE request_id = ?',
          ['matched', requestId]
        );
      }
      
      // Commit transaction
      await connection.commit();
      connection.release();
      
      // Log activity to Supabase
      await logActivity('match_created', {
        match_id: matchId,
        donation_id: donationId,
        request_id: requestId,
      });
      
      // Update Supabase donation status
      await supabase
        .from('recent_donations')
        .update({ status: 'matched' })
        .eq('donation_id', donationId);
      
      // Fetch complete match data
      const [rows] = await db.query(
        `SELECT m.*, d.item_name as donation_item, d.donor_id, d.status as donation_status, d.quantity as donation_quantity,
                r.item_name as request_item, r.status as request_status, r.quantity as request_quantity,
                u.name as donor_name, u.email as donor_email,
                o.org_name, o.contact_info as org_contact_info
         FROM matches m
         JOIN donations d ON m.donation_id = d.donation_id
         LEFT JOIN requests r ON m.request_id = r.request_id
         JOIN users u ON d.donor_id = u.user_id
         JOIN organizations o ON m.org_id = o.org_id
         WHERE m.match_id = ?`,
        [matchId]
      );
      
      const formattedData = convertToFrontendFormat(rows[0]);
      res.status(201).json({ success: true, data: formattedData });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/matches/:id - Update match
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, status } = req.body; // action: 'complete' or 'cancel', or status: 'pending', 'completed', 'cancelled'
    
    // Support both action-based and status-based updates
    let finalAction = action;
    if (status) {
      if (status === 'completed') finalAction = 'complete';
      if (status === 'cancelled') finalAction = 'cancel';
    }
    
    if (!finalAction || !['complete', 'cancel'].includes(finalAction)) {
      return res.status(400).json({
        success: false,
        error: 'Action or status is required'
      });
    }
    
    const [match] = await db.query(
      'SELECT donation_id, request_id FROM matches WHERE match_id = ?',
      [id]
    );
    
    if (match.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      if (finalAction === 'complete') {
        // Update match status to completed
        await connection.query(
          'UPDATE matches SET status = ? WHERE match_id = ?',
          ['completed', id]
        );
        
        // Mark donation as delivered (only if donation exists)
        if (match[0].donation_id) {
          await connection.query(
            'UPDATE donations SET status = ? WHERE donation_id = ?',
            ['delivered', match[0].donation_id]
          );
          
          // Update Supabase
          await supabase
            .from('recent_donations')
            .update({ status: 'delivered' })
            .eq('donation_id', match[0].donation_id);
        }
        
        // Mark request as fulfilled (if request exists)
        if (match[0].request_id) {
          await connection.query(
            'UPDATE requests SET status = ? WHERE request_id = ?',
            ['fulfilled', match[0].request_id]
          );
        }
      } else if (finalAction === 'cancel') {
        // Update match status to cancelled
        await connection.query(
          'UPDATE matches SET status = ? WHERE match_id = ?',
          ['cancelled', id]
        );
        
        // Revert donation to available (only if donation exists)
        if (match[0].donation_id) {
          await connection.query(
            'UPDATE donations SET status = ? WHERE donation_id = ?',
            ['available', match[0].donation_id]
          );
          
          // Update Supabase
          await supabase
            .from('recent_donations')
            .update({ status: 'available' })
            .eq('donation_id', match[0].donation_id);
        }
        
        // Revert request to open (if request exists)
        if (match[0].request_id) {
          await connection.query(
            'UPDATE requests SET status = ? WHERE request_id = ?',
            ['open', match[0].request_id]
          );
        }
      }
      
      await connection.commit();
      connection.release();
      
      // Log activity
      await logActivity('match_updated', {
        match_id: parseInt(id),
        action: action,
      });
      
      const [rows] = await db.query(
        `SELECT m.*, d.item_name as donation_item, d.status as donation_status, d.quantity as donation_quantity,
                r.item_name as request_item, r.status as request_status, r.quantity as request_quantity,
                u.name as donor_name, u.email as donor_email,
                o.org_name, o.contact_info as org_contact_info
         FROM matches m
         LEFT JOIN donations d ON m.donation_id = d.donation_id
         LEFT JOIN requests r ON m.request_id = r.request_id
         LEFT JOIN users u ON m.donor_id = u.user_id
         JOIN organizations o ON m.org_id = o.org_id
         WHERE m.match_id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Match not found after update'
        });
      }
      
      const formattedData = convertToFrontendFormat(rows[0]);
      res.json({ success: true, data: formattedData });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/matches/:id - Delete match
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get match info before deletion
    const [match] = await db.query(
      'SELECT donation_id, request_id FROM matches WHERE match_id = ?',
      [id]
    );
    
    if (match.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete match
      await connection.query('DELETE FROM matches WHERE match_id = ?', [id]);
      
      // Revert donation and request status
      await connection.query(
        'UPDATE donations SET status = ? WHERE donation_id = ?',
        ['available', match[0].donation_id]
      );
      await connection.query(
        'UPDATE requests SET status = ? WHERE request_id = ?',
        ['open', match[0].request_id]
      );
      
      await connection.commit();
      connection.release();
      
      // Update Supabase
      await supabase
        .from('recent_donations')
        .update({ status: 'available' })
        .eq('donation_id', match[0].donation_id);
      
      // Log activity
      await logActivity('match_deleted', { match_id: parseInt(id) });
      
      res.status(204).end();
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

