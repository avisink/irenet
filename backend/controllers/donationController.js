const db = require('../config/database');
const { supabase } = require('../config/supabase');

// Convert database snake_case to frontend camelCase
const convertToFrontendFormat = (dbData) => {
  if (!dbData) return null;
  
  return {
    donationId: dbData.donation_id,
    donorId: dbData.donor_id,
    itemName: dbData.item_name,
    category: dbData.category,
    quantity: dbData.quantity,
    status: dbData.status,
    description: dbData.description,
    location: dbData.location,
    createdAt: dbData.created_at,
    donorName: dbData.donor_name,
    donorEmail: dbData.donor_email,
  };
};

// Convert frontend camelCase to database snake_case
const convertToDbFormat = (frontendData) => {
  const dbData = {};
  
  if (frontendData.donorId !== undefined) dbData.donor_id = frontendData.donorId;
  if (frontendData.itemName !== undefined) dbData.item_name = frontendData.itemName;
  if (frontendData.category !== undefined) dbData.category = frontendData.category;
  if (frontendData.quantity !== undefined) dbData.quantity = frontendData.quantity;
  if (frontendData.status !== undefined) dbData.status = frontendData.status;
  if (frontendData.description !== undefined) dbData.description = frontendData.description;
  if (frontendData.location !== undefined) dbData.location = frontendData.location;
  
  return dbData;
};

// Sync donation summary to Supabase
const syncToSupabase = async (donationId, itemName, category, quantity, status, donorId) => {
  try {
    const { error } = await supabase
      .from('recent_donations')
      .insert({
        donation_id: donationId,
        item_name: itemName,
        category: category,
        quantity: quantity,
        status: status,
        donor_id: donorId,
      });
    
    if (error) {
      console.error('Error syncing to Supabase:', error);
      // Don't throw - allow MySQL operation to succeed even if Supabase sync fails
    } else {
      console.log(`Synced donation ${donationId} to Supabase`);
    }
  } catch (err) {
    console.error('Error in Supabase sync:', err);
  }
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

// GET /api/donations - Get all donations
exports.getAll = async (req, res) => {
  try {
    const { status, category, donorId } = req.query;
    
    let query = `
      SELECT d.*, u.name as donor_name, u.email as donor_email 
      FROM donations d 
      JOIN users u ON d.donor_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }
    
    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }
    
    if (donorId) {
      query += ' AND d.donor_id = ?';
      params.push(donorId);
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const [rows] = await db.query(query, params);
    const formattedData = rows.map(convertToFrontendFormat);
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/donations/:id - Get donation by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT d.*, u.name as donor_name, u.email as donor_email 
       FROM donations d 
       JOIN users u ON d.donor_id = u.user_id 
       WHERE d.donation_id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/donations - Create donation
exports.create = async (req, res) => {
  try {
    const { donorId, itemName, category, quantity, status, description, location } = req.body;
    
    if (!donorId || !itemName || !category || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: donorId, itemName, category, quantity'
      });
    }
    
    const dbData = convertToDbFormat({
      donorId,
      itemName,
      category,
      quantity,
      status: status || 'available',
      description,
      location,
    });
    
    const [result] = await db.query(
      'INSERT INTO donations (donor_id, item_name, category, quantity, status, description, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        dbData.donor_id,
        dbData.item_name,
        dbData.category,
        dbData.quantity,
        dbData.status,
        dbData.description || null,
        dbData.location || null,
      ]
    );
    
    const donationId = result.insertId;
    
    // Sync to Supabase
    await syncToSupabase(
      donationId,
      dbData.item_name,
      dbData.category,
      dbData.quantity,
      dbData.status,
      dbData.donor_id
    );
    
    // Log activity
    await logActivity('donation_created', {
      donation_id: donationId,
      item_name: dbData.item_name,
      category: dbData.category,
    });
    
    const [rows] = await db.query(
      `SELECT d.*, u.name as donor_name, u.email as donor_email 
       FROM donations d 
       JOIN users u ON d.donor_id = u.user_id 
       WHERE d.donation_id = ?`,
      [donationId]
    );
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.status(201).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/donations/:id - Update donation
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const dbData = convertToDbFormat(updateData);
    
    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });
    
    if (Object.keys(dbData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    const setClause = Object.keys(dbData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(dbData);
    values.push(id);
    
    const [result] = await db.query(
      `UPDATE donations SET ${setClause} WHERE donation_id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }
    
    // If status changed, update Supabase
    if (dbData.status) {
      const [donation] = await db.query(
        'SELECT donation_id, item_name, category, quantity, status, donor_id FROM donations WHERE donation_id = ?',
        [id]
      );
      
      if (donation.length > 0) {
        const d = donation[0];
        // Update Supabase record
        await supabase
          .from('recent_donations')
          .update({ status: d.status })
          .eq('donation_id', id);
      }
    }
    
    // Log activity
    await logActivity('donation_updated', {
      donation_id: parseInt(id),
      updates: dbData,
    });
    
    const [rows] = await db.query(
      `SELECT d.*, u.name as donor_name, u.email as donor_email 
       FROM donations d 
       JOIN users u ON d.donor_id = u.user_id 
       WHERE d.donation_id = ?`,
      [id]
    );
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/donations/:id - Delete donation
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM donations WHERE donation_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }
    
    // Remove from Supabase
    await supabase
      .from('recent_donations')
      .delete()
      .eq('donation_id', id);
    
    // Log activity
    await logActivity('donation_deleted', { donation_id: parseInt(id) });
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

