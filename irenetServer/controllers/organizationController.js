const db = require('../config/database');

// Convert database snake_case to frontend camelCase
const convertToFrontendFormat = (dbData) => {
  if (!dbData) return null;
  
  return {
    orgId: dbData.org_id,
    userId: dbData.user_id,
    orgName: dbData.org_name,
    contactInfo: dbData.contact_info,
    // Note: ein, address, and mission_statement columns don't exist in the database schema
    userName: dbData.user_name,
    userEmail: dbData.user_email,
  };
};

// Convert frontend camelCase to database snake_case
const convertToDbFormat = (frontendData) => {
  const dbData = {};
  
  // Only include fields that exist in the database schema
  if (frontendData.userId !== undefined) dbData.user_id = frontendData.userId;
  if (frontendData.orgName !== undefined) dbData.org_name = frontendData.orgName;
  if (frontendData.contactInfo !== undefined) dbData.contact_info = frontendData.contactInfo;
  // Note: ein, address, and mission_statement columns don't exist in the database schema
  
  return dbData;
};

// GET /api/organizations - Get all organizations
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.name as user_name, u.email as user_email 
      FROM organizations o 
      JOIN users u ON o.user_id = u.user_id
    `);
    const formattedData = rows.map(convertToFrontendFormat);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/organizations/:id - Get organization by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM organizations o 
       JOIN users u ON o.user_id = u.user_id 
       WHERE o.org_id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/organizations - Create organization
exports.create = async (req, res) => {
  try {
    const { userId, orgName, contactInfo } = req.body;
    
    if (!userId || !orgName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, orgName'
      });
    }
    
    const dbData = convertToDbFormat({
      userId,
      orgName,
      contactInfo,
    });
    
    const [result] = await db.query(
      'INSERT INTO organizations (user_id, org_name, contact_info) VALUES (?, ?, ?)',
      [
        dbData.user_id,
        dbData.org_name,
        dbData.contact_info || null,
      ]
    );
    
    const [rows] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM organizations o 
       JOIN users u ON o.user_id = u.user_id 
       WHERE o.org_id = ?`,
      [result.insertId]
    );
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.status(201).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/organizations/:id - Update organization
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
      `UPDATE organizations SET ${setClause} WHERE org_id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const [rows] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email 
       FROM organizations o 
       JOIN users u ON o.user_id = u.user_id 
       WHERE o.org_id = ?`,
      [id]
    );
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/organizations/:id - Delete organization
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM organizations WHERE org_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

