# Dual-Persistence Application for Social Impact: ireNet

## Project Overview

**ireNet** is a dual-persistence web application designed to bridge the gap between donors and verified nonprofit organizations, facilitating efficient donation matching and distribution of essential items to communities in need.

---

## Problem Statement

Many individuals and organizations want to donate useful items (food, clothing, supplies, etc.), but there's a significant gap in connecting them efficiently to verified nonprofits and communities in need. Current donation platforms often lack:

- Real-time visibility of available donations
- Efficient matching between donor offerings and organizational needs
- Streamlined communication between parties
- Analytics and tracking of donation impact

---

## Target User Population

### Primary Users

1. **Donors**
   - Individuals with items to donate
   - Businesses with surplus inventory
   - Community groups organizing donation drives

2. **Nonprofit Organizations**
   - Registered 501(c)(3) organizations
   - Community centers
   - Food banks and shelters
   - Educational institutions serving underserved communities

3. **Administrators**
   - Platform moderators
   - System administrators managing user verification and matches

---

## Solution: ireNet Platform

ireNet provides a lightweight, efficient platform that:

- Enables **donors** to post available items with details (category, quantity, condition)
- Allows **organizations** to browse available donations or post specific requests
- Facilitates **automatic and manual matching** between donations and needs
- Provides **real-time activity feeds** and analytics
- Maintains **data redundancy** for high availability and fast reads

---

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MySQL** - Primary relational database (3NF compliant)
- **Supabase** - NoSQL database for redundancy and analytics

### Database Architecture

**MySQL (Authoritative System of Record)**
- Stores all structured data: users, donations, organizations, requests, matches
- Designed in 3rd Normal Form for data integrity
- Handles all write operations and authoritative data

**Supabase (Redundancy & Analytics)**
- Stores summaries and logs for fast front-end reads
- Recent donations feed
- Activity logs
- Popular items analytics
- Synchronized from MySQL via backend triggers

### Data Synchronization Strategy

- **Donation Creation**: MySQL → Supabase (summary pushed for fast reads)
- **Request Creation**: MySQL → Supabase (optional, for trending items)
- **Match Creation**: MySQL → Supabase (activity log entry)
- **All updates**: MySQL first, then sync to Supabase

---

## User Roles & Ideal User Flows

### 1. Donor User Flow

**Registration & Onboarding**
1. Visit landing page, view recent donations and platform stats
2. Register as "Donor" with email, password, name, contact info
3. Email verification (stretch feature)
4. Access donor dashboard

**Posting a Donation**
1. Navigate to "Create Donation" from dashboard
2. Fill form: item name, category, quantity, condition, description, location
3. Submit donation → Saved to MySQL
4. Summary automatically synced to Supabase for public feed
5. Donation appears in "My Donations" list with status "Available"

**Managing Donations**
1. View all posted donations in dashboard
2. See match status for each donation (Available, Matched, Completed)
3. Receive notifications when organization requests match
4. Accept/decline match requests
5. Mark donation as completed after successful handoff

**Browsing & Discovery**
1. View activity feed showing recent donations (from Supabase)
2. See popular categories and trending items
3. Filter by category, location, date

---

### 2. Organization User Flow

**Registration & Verification**
1. Register as "Organization" with organization details
2. Provide: organization name, EIN/tax ID, address, mission statement (optional till we figure out core logistics)
3. Admin reviews and verifies organization
4. Upon verification, access organization dashboard

**Browsing Available Donations**
1. View "Available Donations" feed (powered by Supabase for fast loading)
2. Filter by category, location, quantity
3. Click donation to view full details
4. Request match with donor
5. Wait for donor approval

**Posting Requests**
1. Navigate to "Post Request" from dashboard
2. Specify needed items: category, quantity, urgency, description
3. Request saved to MySQL
4. Optional - stretch feature: Summary synced to Supabase for trending items
5. Organizations can browse requests from other orgs to coordinate

**Managing Matches**
1. View "My Matches" showing all active matches
2. See match status: Pending, Approved, Completed
3. Communicate with donor (via contact info - not through ireNet, platform messaging would be a good stretch feature)
4. Coordinate pickup/delivery logistics (outside ireNet for now)
5. Mark match as completed after receiving items
6. View match history and impact metrics (impact metrics - stretch feature)

**Analytics & Insights**
1. View dashboard stats: items received, active matches, completed donations
2. See activity feed of recent platform activity
3. Track popular requested items (from Supabase analytics)

---

### 3. Administrator User Flow

**User Management**
1. Access admin dashboard
2. View all registered users (donors and organizations)
3. Review pending organization verification requests
4. Approve/reject organization registrations
5. Manage user accounts (suspend, activate, view details)

**Match Center**
1. Navigate to "Match Center" - central hub for all matches
2. View all active matches between donors and organizations
3. See match details: donor info, organization info, items, status
4. Manually create matches if needed
5. Approve matches (if approval workflow enabled)
6. Monitor match completion rates

**Platform Monitoring**
1. View activity logs (from Supabase)
2. Monitor recent donations and requests
3. Track platform usage statistics
4. View popular categories and trending items
5. Identify inactive users or abandoned donations

**Data Management**
1. Access both MySQL and Supabase databases
2. Verify data synchronization between systems
3. Run reports on donation impact
4. Manage database backups and maintenance

---

## Application Features

### Core Features

1. **User Authentication & Authorization**
   - Registration for donors and organizations
   - Role-based access control (Donor, Organization, Admin)
   - Session management and security

2. **Donation Management**
   - Create, read, update, delete donations
   - Category-based organization
   - Status tracking (Available, Matched, Completed)
   - Image upload support (future enhancement)

3. **Request Management**
   - Organizations can post specific needs
   - Browse and filter requests
   - Request matching with donations

4. **Match System**
   - Automatic matching suggestions based on category and location
   - Manual match creation by admins
   - Match approval workflow
   - Match status tracking

5. **Activity Feed**
   - Real-time feed of recent donations (from Supabase)
   - Recent matches and completions
   - Popular items and categories

6. **Dashboard Analytics**
   - User-specific statistics
   - Platform-wide metrics
   - Impact tracking

### Pages & Navigation

| Page | Function | Access Level |
| :---- | :---- | :---- |
| **Landing Page** | Overview, stats, recent donations feed | Public |
| **Register/Login** | User authentication | Public |
| **Donor Dashboard** | Create/view donations, manage matches | Donor |
| **Organization Dashboard** | Browse donations, post requests, manage matches | Organization |
| **Match Center** | View and manage all matches | Admin |
| **Activity Feed** | Recent platform activity | All authenticated users |
| **User Profile** | Edit profile, view history | All authenticated users |

---

## Database Design

### MySQL Schema (3NF Compliant)

**Entities:**
- `users` - All user accounts (donors, orgs, admins)
- `organizations` - Extended org information
- `donations` - Donation posts from donors
- `requests` - Item requests from organizations
- `matches` - Matches between donations and requests

**Key Relationships:**
- Users → Organizations (one-to-one for org users)
- Users → Donations (one-to-many)
- Organizations → Requests (one-to-many)
- Donations ↔ Requests (many-to-many via matches)

**3NF Compliance:**
- ✓ 1NF: All attributes atomic, no repeating groups
- ✓ 2NF: No partial dependencies (all non-key attributes fully dependent on primary key)
- ✓ 3NF: No transitive dependencies (all attributes depend only on primary key)

### Supabase Schema

**Tables:**
- `recent_donations` - Summaries of recent donations for fast reads
- `activity_logs` - Event logs in JSON format for analytics

**Purpose:**
- Fast front-end reads without querying MySQL
- Analytics and trending data
- Activity feed generation
- Redundancy for high availability

---

## Technical Implementation

### Backend Architecture

- **Express.js REST API** - Handles all CRUD operations
- **MySQL Connection Pool** - Efficient database connections
- **Supabase Client** - Synchronization and analytics
- **Event Triggers** - Automatic sync from MySQL to Supabase

### Data Flow Examples

**Donor Creates Donation:**
1. POST `/api/donations` → Save to MySQL `donations` table
2. Backend trigger → Extract summary (item_name, category, quantity, status)
3. Insert summary into Supabase `recent_donations` table
4. Return success response to frontend

**Organization Requests Match:**
1. POST `/api/matches` → Save to MySQL `matches` table
2. Backend trigger → Log event to Supabase `activity_logs`
3. Update donation status in MySQL
4. Sync updated donation summary to Supabase

**View Activity Feed:**
1. GET `/api/activity` → Query Supabase `recent_donations` (fast read)
2. Return recent donations for display
3. No MySQL query needed for this read-heavy operation

---

## Learning Objectives Achieved

1. **3NF Database Design** - MySQL schema eliminates redundancy and maintains data integrity
2. **NoSQL Integration** - Supabase provides redundancy and optimized read performance
3. **Real-World Problem Solving** - Addresses actual gap in donation ecosystem
4. **Full-Stack Development** - Complete application with frontend, backend, and dual databases

---

## Project Status & Next Steps

### Completed
- Database schema design (MySQL 3NF)
- Supabase schema design
- Backend API structure
- Basic CRUD operations

### In Progress
- Frontend implementation
- Data synchronization logic
- User authentication
- Match system logic

### Future Enhancements
- Real-time notifications
- Image upload for donations
- Messaging system between users
- Advanced analytics dashboard
- Mobile app support
