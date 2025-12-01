const db = require('../config/database');

// Convert database snake_case to frontend camelCase
const convertToFrontendFormat = (dbData) => {
  if (!dbData) return null;
  
  return {
    requestId: dbData.request_id,
    orgId: dbData.org_id,
    itemName: dbData.item_name,
    category: dbData.category,
    quantity: dbData.quantity,
    status: dbData.status,
    description: dbData.description,
    urgency: dbData.urgency,
    orgName: dbData.org_name,
    contactInfo: dbData.contact_info,
  };
};

// Convert frontend camelCase to database snake_case
const convertToDbFormat = (frontendData) => {
  const dbData = {};
  
  if (frontendData.orgId !== undefined) dbData.org_id = frontendData.orgId;
  if (frontendData.itemName !== undefined) dbData.item_name = frontendData.itemName;
  if (frontendData.category !== undefined) dbData.category = frontendData.category;
  if (frontendData.quantity !== undefined) dbData.quantity = frontendData.quantity;
  if (frontendData.status !== undefined) dbData.status = frontendData.status;
  if (frontendData.description !== undefined) dbData.description = frontendData.description;
  if (frontendData.urgency !== undefined) dbData.urgency = frontendData.urgency;
  
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

// GET /api/requests - Get all requests
exports.getAll = async (req, res) => {
  try {
    const { status, category, orgId } = req.query;
    
    let query = `
      SELECT r.*, o.org_name, o.contact_info 
      FROM requests r 
      JOIN organizations o ON r.org_id = o.org_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    if (category) {
      query += ' AND r.category = ?';
      params.push(category);
    }
    
    if (orgId) {
      query += ' AND r.org_id = ?';
      params.push(orgId);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    const [rows] = await db.query(query, params);
    const formattedData = rows.map(convertToFrontendFormat);
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/requests/:id - Get request by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT r.*, o.org_name, o.contact_info 
       FROM requests r 
       JOIN organizations o ON r.org_id = o.org_id 
       WHERE r.request_id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/requests - Create request
exports.create = async (req, res) => {
  try {
    const { orgId, itemName, category, quantity, status, description, urgency } = req.body;
    
    if (!orgId || !itemName || !category || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orgId, itemName, category, quantity'
      });
    }
    
    const dbData = convertToDbFormat({
      orgId,
      itemName,
      category,
      quantity,
      status: status || 'open',
      description,
      urgency,
    });
    
    const [result] = await db.query(
      'INSERT INTO requests (org_id, item_name, category, quantity, status, description, urgency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        dbData.org_id,
        dbData.item_name,
        dbData.category,
        dbData.quantity,
        dbData.status,
        dbData.description || null,
        dbData.urgency || null,
      ]
    );
    
    // Log activity
    await logActivity('request_created', {
      request_id: result.insertId,
      item_name: dbData.item_name,
      category: dbData.category,
      org_id: dbData.org_id,
    });
    
    const [rows] = await db.query(
      `SELECT r.*, o.org_name, o.contact_info 
       FROM requests r 
       JOIN organizations o ON r.org_id = o.org_id 
       WHERE r.request_id = ?`,
      [result.insertId]
    );
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.status(201).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/requests/:id - Update request
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
      `UPDATE requests SET ${setClause} WHERE request_id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    // Log activity
    await logActivity('request_updated', {
      request_id: parseInt(id),
      updates: dbData,
    });
    
    const [rows] = await db.query(
      `SELECT r.*, o.org_name, o.contact_info 
       FROM requests r 
       JOIN organizations o ON r.org_id = o.org_id 
       WHERE r.request_id = ?`,
      [id]
    );
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/requests/:id - Delete request
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM requests WHERE request_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }
    
    // Log activity
    await logActivity('request_deleted', { request_id: parseInt(id) });
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

