require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

// Import routes
const userRoutes = require('./routes/userRoutes');
const donationRoutes = require('./routes/donationRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const requestRoutes = require('./routes/requestRoutes');
const matchRoutes = require('./routes/matchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the ireNet API' });
});

// Health check endpoint
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

// Analytics endpoint - Get recent donations from MySQL
app.get('/api/analytics/recent-donations', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const query = `
      SELECT d.*, u.name as donor_name, u.email as donor_email
      FROM donations d
      LEFT JOIN users u ON d.donor_id = u.user_id
      ORDER BY d.created_at DESC
      LIMIT ?
    `;
    const [rows] = await db.query(query, [parseInt(limit)]);
    
    res.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error('Error fetching recent donations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Activity logs endpoint - Get activity logs from MySQL
// Note: This endpoint is kept for compatibility but may need a dedicated activity_logs table
app.get('/api/analytics/activity-logs', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    // For now, return empty array or implement activity logging in MySQL
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/matches', matchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
