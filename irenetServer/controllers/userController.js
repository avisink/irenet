const db = require('../config/database');
const { supabase } = require('../config/supabase');

// Convert database snake_case to frontend camelCase
const convertToFrontendFormat = (dbData) => {
  if (!dbData) return null;
  
  return {
    userId: dbData.user_id,
    name: dbData.name,
    email: dbData.email,
    role: dbData.role,
    createdAt: dbData.created_at,
  };
};

// Convert frontend camelCase to database snake_case
const convertToDbFormat = (frontendData) => {
  const dbData = {};
  
  if (frontendData.name !== undefined) dbData.name = frontendData.name;
  if (frontendData.email !== undefined) dbData.email = frontendData.email;
  if (frontendData.passwordHash !== undefined) dbData.password_hash = frontendData.passwordHash;
  if (frontendData.role !== undefined) dbData.role = frontendData.role;
  
  return dbData;
};

// GET /api/users - Get all users
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, name, email, role FROM users');
    const formattedData = rows.map(convertToFrontendFormat);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/users/:id - Get user by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT user_id, name, email, role FROM users WHERE user_id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/users/login - Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password'
      });
    }
    
    // Find user by email
    const [rows] = await db.query(
      'SELECT user_id, name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    const user = rows[0];
    
    // In production, use bcrypt to compare hashed passwords
    // For now, simple comparison (NOT SECURE - for development only)
    if (user.password_hash !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Return user data (without password)
    const formattedData = convertToFrontendFormat({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    
    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/users - Create a user (register)
exports.create = async (req, res) => {
  try {
    const { name, email, passwordHash, role } = req.body;
    
    if (!name || !email || !passwordHash || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, passwordHash, role'
      });
    }
    
    // Validate role
    const validRoles = ['donor', 'organization', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: donor, organization, admin'
      });
    }
    
    const dbData = convertToDbFormat({ name, email, passwordHash, role });
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [dbData.name, dbData.email, dbData.password_hash, dbData.role]
    );
    
    res.status(201).json({
      success: true,
      data: { userId: result.insertId, name, email, role }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/users/:id - Update user
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
      `UPDATE users SET ${setClause} WHERE user_id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const [rows] = await db.query(
      'SELECT user_id, name, email, role FROM users WHERE user_id = ?',
      [id]
    );
    
    const formattedData = convertToFrontendFormat(rows[0]);
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/users/:id - Delete user
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

