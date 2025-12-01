
# ireNet - Social Donation Matching Platform

ireNet is a comprehensive food waste reduction and redistribution platform that connects food donors with organizations serving those in need. The application addresses the critical social problem of food waste while fighting food insecurity.

## 🚀 Complete Setup Guide

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** server installed and running
- **Git** for cloningg

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "Social Donation Matching App"
git checkout fullproject  # Switch to the reorganized branch
```

### Step 2: Database Setup
```bash
# Start MySQL service (varies by OS)
# macOS: brew services start mysql
# Windows: Start MySQL service
# Linux: sudo systemctl start mysql

# Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS irenet_db;"

# Run database schema
mysql -u root -p irenet_db < backend/config/database-setup.sql
```

### Step 3: Backend Setup
```bash
cd backend

# Install backend dependencies
npm install

# Create environment file
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=irenet_db
PORT=5001
EOF

# Start the backend server
node server.js
```
**✅ Backend should now be running on http://localhost:5001**

### Step 4: Frontend Setup (New Terminal)
```bash
# Open new terminal, navigate to project root
cd "Social Donation Matching App"
cd ui

# Install frontend dependencies  
npm install

# Start the development server
npm run dev
```
**✅ Frontend should now be running on http://localhost:5173**

### Step 5: Configure Supabase (Optional but Recommended)
1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key
3. Update `ui/src/utils/supabase/info.tsx` with your credentials

### Step 6: Demo the Platform

#### **Option A: Quick Demo with Test Data**
```bash
# Add some test data to MySQL
mysql -u root -p irenet_db << EOF
INSERT INTO users (name, email, password_hash, role) VALUES 
('John Donor', 'donor@test.com', 'password123', 'donor'),
('Food Bank Central', 'org@test.com', 'password123', 'organization');

INSERT INTO organizations (user_id, org_name, contact_info) VALUES 
(2, 'Food Bank Central', 'contact@foodbank.org');
EOF
```

#### **Option B: Full Demo Flow**
1. **Visit** http://localhost:5173
2. **Sign Up** as a donor and create some donations
3. **Sign Up** as an organization and create some requests  
4. **Test matching** between donations and requests
5. **Test the complete lifecycle** from creation to delivery

### Expected Results
- **Backend API**: http://localhost:5001/api/health should return `{"status":"OK"}`
- **Frontend**: http://localhost:5173 should show the ireNet landing page
- **Database**: MySQL should have the `irenet_db` with proper tables

### Troubleshooting
```bash
# Check if backend is running
curl http://localhost:5001/api/health

# Check if frontend is accessible
curl http://localhost:5173

# Verify database connection
mysql -u root -p irenet_db -e "SHOW TABLES;"
```

### Demo User Accounts
After setup, you can create accounts through the UI or use these test credentials if you added test data:
- **Donor**: `donor@test.com` / `password123`
- **Organization**: `org@test.com` / `password123`

## Project Structure

This project has been organized into two main directories:

### 📱 `/ui` - Frontend Application
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Port**: http://localhost:5173

### 🚀 `/backend` - API Server
- **Runtime**: Node.js with Express.js
- **Database**: MySQL with Supabase sync
- **Port**: http://localhost:5001

## Features

- **Dual User Roles**: Donors and Organizations
- **Smart Matching**: Connect donations with requests
- **Real-time Updates**: Live status tracking
- **Dual Database**: MySQL primary with Supabase backup
- **Authentication**: Secure user management
- **Mobile Responsive**: Works on all devices

## Architecture

- **3-Tier Architecture**: React → Express API → MySQL Database
- **Dual Storage**: MySQL (primary) + Supabase (backup/sync)
- **Transaction Safety**: ACID compliance for critical operations
- **3NF Database Design**: Properly normalized schema

For detailed technical documentation, see the README files in the `ui/` and `backend/` directories.
  