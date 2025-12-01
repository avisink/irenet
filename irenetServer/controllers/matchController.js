const db = require('../config/database');
const { supabase } = require('../config/supabase');

// Convert database snake_case to frontend camelCase
const convertToFrontendFormat = (dbData) => {
  if (!dbData) return null;
  
  return {
    matchId: dbData.match_id,
    donationId: dbData.donation_id,
    requestId: dbData.request_id,
    matchDate: dbData.match_date,
    donationItem: dbData.donation_item,
    requestItem: dbData.request_item,
    donorId: dbData.donor_id,
    orgId: dbData.org_id,
    donorName: dbData.donor_name,
    donorEmail: dbData.donor_email,
    orgName: dbData.org_name,
    donationStatus: dbData.donation_status,
    requestStatus: dbData.request_status,
  };
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

// GET /api/matches - Get all matches
exports.getAll = async (req, res) => {
  try {
    let query = `
      SELECT m.*, d.item_name as donation_item, d.donor_id, d.status as donation_status,
             r.item_name as request_item, r.org_id, r.status as request_status,
             u.name as donor_name, u.email as donor_email, o.org_name
      FROM matches m
      JOIN donations d ON m.donation_id = d.donation_id
      JOIN requests r ON m.request_id = r.request_id
      JOIN users u ON d.donor_id = u.user_id
      JOIN organizations o ON r.org_id = o.org_id
      ORDER BY m.match_date DESC
    `;
    
    const [rows] = await db.query(query);
    const formattedData = rows.map(convertToFrontendFormat);
    
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
      `SELECT m.*, d.item_name as donation_item, d.donor_id, d.status as donation_status,
              r.item_name as request_item, r.org_id, r.status as request_status,
              u.name as donor_name, u.email as donor_email, o.org_name
       FROM matches m
       JOIN donations d ON m.donation_id = d.donation_id
       JOIN requests r ON m.request_id = r.request_id
       JOIN users u ON d.donor_id = u.user_id
       JOIN organizations o ON r.org_id = o.org_id
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

// POST /api/matches - Create match
exports.create = async (req, res) => {
  try {
    const { donationId, requestId } = req.body;
    
    if (!donationId || !requestId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: donationId, requestId'
      });
    }
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create match
      const [result] = await connection.query(
        'INSERT INTO matches (donation_id, request_id, match_date) VALUES (?, ?, CURDATE())',
        [donationId, requestId]
      );
      
      const matchId = result.insertId;
      
      // Update donation status to 'matched'
      await connection.query(
        'UPDATE donations SET status = ? WHERE donation_id = ?',
        ['matched', donationId]
      );
      
      // Update request status to 'matched'
      await connection.query(
        'UPDATE requests SET status = ? WHERE request_id = ?',
        ['matched', requestId]
      );
      
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
        `SELECT m.*, d.item_name as donation_item, d.donor_id, d.status as donation_status,
                r.item_name as request_item, r.org_id, r.status as request_status,
                u.name as donor_name, u.email as donor_email, o.org_name
         FROM matches m
         JOIN donations d ON m.donation_id = d.donation_id
         JOIN requests r ON m.request_id = r.request_id
         JOIN users u ON d.donor_id = u.user_id
         JOIN organizations o ON r.org_id = o.org_id
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

// PATCH /api/matches/:id - Mark match as completed
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'complete' or 'cancel'
    
    if (!action || !['complete', 'cancel'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action is required and must be "complete" or "cancel"'
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
      if (action === 'complete') {
        // Mark donation as delivered and request as fulfilled
        await connection.query(
          'UPDATE donations SET status = ? WHERE donation_id = ?',
          ['delivered', match[0].donation_id]
        );
        await connection.query(
          'UPDATE requests SET status = ? WHERE request_id = ?',
          ['fulfilled', match[0].request_id]
        );
        
        // Update Supabase
        await supabase
          .from('recent_donations')
          .update({ status: 'delivered' })
          .eq('donation_id', match[0].donation_id);
      } else if (action === 'cancel') {
        // Revert donation and request to available/open
        await connection.query(
          'UPDATE donations SET status = ? WHERE donation_id = ?',
          ['available', match[0].donation_id]
        );
        await connection.query(
          'UPDATE requests SET status = ? WHERE request_id = ?',
          ['open', match[0].request_id]
        );
        
        // Update Supabase
        await supabase
          .from('recent_donations')
          .update({ status: 'available' })
          .eq('donation_id', match[0].donation_id);
      }
      
      await connection.commit();
      connection.release();
      
      // Log activity
      await logActivity('match_updated', {
        match_id: parseInt(id),
        action: action,
      });
      
      const [rows] = await db.query(
        `SELECT m.*, d.item_name as donation_item, d.donor_id, d.status as donation_status,
                r.item_name as request_item, r.org_id, r.status as request_status,
                u.name as donor_name, u.email as donor_email, o.org_name
         FROM matches m
         JOIN donations d ON m.donation_id = d.donation_id
         JOIN requests r ON m.request_id = r.request_id
         JOIN users u ON d.donor_id = u.user_id
         JOIN organizations o ON r.org_id = o.org_id
         WHERE m.match_id = ?`,
        [id]
      );
      
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

