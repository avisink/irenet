const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Irenet API' });
});


app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      const [rows] = await db.query('SELECT 1 as test');
      res.json({ 
        status: 'OK', 
        message: 'Server and database are running',
        database: 'connected'
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'ERROR', 
        message: 'Database connection failed',
        error: error.message 
      });
    }
  });
  
  // ==================== USERS ROUTES ====================
  // Get all users
  app.get('/api/users', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT user_id, name, email, role FROM users');
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Get user by ID
  app.get('/api/users/:id', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT user_id, name, email, role FROM users WHERE user_id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Create a user (register)
  app.post('/api/users', async (req, res) => {
    try {
      const { name, email, password_hash, role } = req.body;
      if (!name || !email || !password_hash || !role) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, password_hash, role]
      );
      res.json({ success: true, user_id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // ==================== ORGANIZATIONS ROUTES ====================
  // Get all organizations
  app.get('/api/organizations', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT o.org_id, o.org_name, o.contact_info, u.name as user_name, u.email 
        FROM organizations o 
        JOIN users u ON o.user_id = u.user_id
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Create organization
  app.post('/api/organizations', async (req, res) => {
    try {
      const { user_id, org_name, contact_info } = req.body;
      if (!user_id || !org_name) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const [result] = await db.query(
        'INSERT INTO organizations (user_id, org_name, contact_info) VALUES (?, ?, ?)',
        [user_id, org_name, contact_info]
      );
      res.json({ success: true, org_id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // ==================== DONATIONS ROUTES ====================
  // Get all donations
  app.get('/api/donations', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT d.*, u.name as donor_name, u.email as donor_email 
        FROM donations d 
        JOIN users u ON d.donor_id = u.user_id
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Get donations by status
  app.get('/api/donations/status/:status', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT d.*, u.name as donor_name 
        FROM donations d 
        JOIN users u ON d.donor_id = u.user_id 
        WHERE d.status = ?
      `, [req.params.status]);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Create donation
  app.post('/api/donations', async (req, res) => {
    try {
      const { donor_id, item_name, category, quantity, status } = req.body;
      if (!donor_id || !item_name || !category || !quantity) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const [result] = await db.query(
        'INSERT INTO donations (donor_id, item_name, category, quantity, status) VALUES (?, ?, ?, ?, ?)',
        [donor_id, item_name, category, quantity, status || 'available']
      );
      res.json({ success: true, donation_id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Update donation status
  app.patch('/api/donations/:id', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }
      const [result] = await db.query(
        'UPDATE donations SET status = ? WHERE donation_id = ?',
        [status, req.params.id]
      );
      res.json({ success: true, message: 'Donation updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // ==================== REQUESTS ROUTES ====================
  // Get all requests
  app.get('/api/requests', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT r.*, o.org_name, o.contact_info 
        FROM requests r 
        JOIN organizations o ON r.org_id = o.org_id
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Get requests by status
  app.get('/api/requests/status/:status', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT r.*, o.org_name 
        FROM requests r 
        JOIN organizations o ON r.org_id = o.org_id 
        WHERE r.status = ?
      `, [req.params.status]);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Create request
  app.post('/api/requests', async (req, res) => {
    try {
      const { org_id, item_name, category, quantity, status } = req.body;
      if (!org_id || !item_name || !category || !quantity) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const [result] = await db.query(
        'INSERT INTO requests (org_id, item_name, category, quantity, status) VALUES (?, ?, ?, ?, ?)',
        [org_id, item_name, category, quantity, status || 'open']
      );
      res.json({ success: true, request_id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Update request status
  app.patch('/api/requests/:id', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }
      const [result] = await db.query(
        'UPDATE requests SET status = ? WHERE request_id = ?',
        [status, req.params.id]
      );
      res.json({ success: true, message: 'Request updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // ==================== MATCHES ROUTES ====================
  // Get all matches
  app.get('/api/matches', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT m.*, d.item_name as donation_item, d.donor_id, 
               r.item_name as request_item, r.org_id,
               u.name as donor_name, o.org_name
        FROM matches m
        JOIN donations d ON m.donation_id = d.donation_id
        JOIN requests r ON m.request_id = r.request_id
        JOIN users u ON d.donor_id = u.user_id
        JOIN organizations o ON r.org_id = o.org_id
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Create match
  app.post('/api/matches', async (req, res) => {
    try {
      const { donation_id, request_id } = req.body;
      if (!donation_id || !request_id) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const [result] = await db.query(
        'INSERT INTO matches (donation_id, request_id, match_date) VALUES (?, ?, CURDATE())',
        [donation_id, request_id]
      );
      
      // Update donation and request status to 'matched'
      await db.query('UPDATE donations SET status = ? WHERE donation_id = ?', ['matched', donation_id]);
      await db.query('UPDATE requests SET status = ? WHERE request_id = ?', ['matched', request_id]);
      
      res.json({ success: true, match_id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
  
  