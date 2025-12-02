# Database Design Documentation

This document describes the database architecture for the ireNet platform, including the MySQL relational database design and the Supabase NoSQL database design.

## Overview

The ireNet platform uses a **dual-database architecture**:

- **MySQL**: Authoritative system of record for all structured data
- **Supabase**: Redundant storage optimized for analytics and fast reads

### Key Principles

- **MySQL = Authoritative System of Record**: All writes and authoritative data storage
- **Supabase = Redundant + Analytics + Fast Reads**: Optimized for high-read scenarios
- **Do NOT update Supabase directly** — only sync from backend
- **Do NOT store sensitive user data in Supabase**
- **Only store summaries, logs, and counts** in Supabase

---

## MySQL Database Design

### Purpose

The MySQL database serves as the **authoritative system of record** for all structured data including users, donations, organizations, requests, and matches. It is designed in **Third Normal Form (3NF)** to ensure data integrity, eliminate redundancy, and support efficient CRUD operations.

### Schema Overview

The database consists of five main entities:

| Entity | Description |
|--------|-------------|
| `users` | Stores all user information (donors, organizations, admins) |
| `donations` | Each donation post made by a donor |
| `organizations` | Registered nonprofits that receive items |
| `requests` | Requests made by organizations for specific needs |
| `matches` | Records successful matches between donations and requests |

<img width="624" height="580" alt="erd" src="https://github.com/user-attachments/assets/8c2b2e34-f601-4ec4-89b5-c9626c26b2d3" />


### Normalization Analysis

#### First Normal Form (1NF) - Atomicity ✓

All attributes contain atomic (indivisible) values:

- `users.name` - Single name value per field
- `donations.item_name` - Single item name
- `donations.quantity` - Single integer value
- No multi-valued attributes or repeating groups

#### Second Normal Form (2NF) - No Partial Dependencies ✓

All non-key attributes are fully dependent on the primary key:

- **users**: All attributes (name, email, password_hash, role) depend on `user_id`
- **organizations**: All attributes depend on `org_id`; `user_id` is a foreign key reference
- **donations**: All attributes depend on `donation_id`; `donor_id` is a foreign key reference
- **requests**: All attributes depend on `request_id`; `org_id` is a foreign key reference
- **matches**: All attributes depend on `match_id`; foreign keys reference other tables

No partial dependencies exist because:
- Each table has a single-column primary key
- All non-key attributes are fully dependent on the entire primary key

#### Third Normal Form (3NF) - No Transitive Dependencies ✓

No transitive dependencies exist where a non-key attribute depends on another non-key attribute:

- **users**: No transitive dependencies (role doesn't determine other attributes)
- **organizations**: `org_name` and `contact_info` are independent attributes
- **donations**: `item_name`, `category`, `quantity`, and `status` are independent
- **requests**: Similar structure with independent attributes
- **matches**: Only contains foreign keys and match_date

### Entity Relationship Structure

```
users (1) ──< (0..1) organizations
users (1) ──< (0..*) donations
organizations (1) ──< (0..*) requests
donations (1) ──< (0..1) matches
requests (1) ──< (0..1) matches
```

### Benefits of 3NF Design

1. **Data Integrity**: Foreign key constraints ensure referential integrity
2. **Elimination of Redundancy**: Each piece of data is stored once
3. **Efficient Updates**: Changes to data only need to be made in one place
4. **Consistent Queries**: Relational structure supports complex JOIN operations
5. **Scalability**: Normalized structure supports growth without data anomalies

### Table Definitions

#### users
- Stores authentication and basic user information
- Role-based access control via `role` ENUM
- Unique email constraint prevents duplicate accounts

#### organizations
- Links to users table via `user_id` foreign key
- Stores organization-specific information
- One-to-one relationship with users (one user = one organization)

#### donations
- Created by donors (users with role 'donor')
- Tracks item details, quantity, and status
- Status ENUM ensures data consistency

#### requests
- Created by organizations
- Similar structure to donations for matching purposes
- Status ENUM tracks request lifecycle

#### matches
- Junction table connecting donations and requests
- Records successful matches with timestamp
- Enables many-to-many relationship between donations and requests

---

## Supabase Database Design

### Purpose

Supabase serves as a **redundant, analytics-optimized database** for high-read scenarios. It provides:

- **Redundancy**: Backup of critical summary data
- **Analytics**: Fast queries for dashboards and reports
- **Fast Reads**: Optimized indexes for front-end performance
- **Flexibility**: JSONB storage for variable event data

### Design Principles

1. **No Direct Writes**: All data flows from MySQL → Supabase via backend sync
2. **No Sensitive Data**: User passwords, personal information excluded
3. **Summary Data Only**: Aggregated, denormalized data for fast reads
4. **Event Logging**: Activity logs stored in flexible JSONB format

### Schema

#### recent_donations

**Purpose**: Fast front-end reads of recent donation summaries

**Design Rationale**:
- Denormalized structure eliminates JOINs for common queries
- Indexed on `created_at` for time-based queries (recent items)
- Indexed on `category` for filtering by item type
- Contains only summary fields needed for display
- No sensitive donor information (only `donor_id` reference)

**Efficiency Benefits**:
- Single-table queries instead of JOINs across multiple MySQL tables
- Optimized indexes for common query patterns
- Fast retrieval for home page, dashboards, and category filters

#### activity_logs

**Purpose**: Flexible event logging and analytics

**Design Rationale**:
- JSONB `data` field allows variable event structures
- No rigid schema needed for different event types
- Indexed on `timestamp` for time-series queries
- Supports analytics queries without impacting MySQL performance

**Efficiency Benefits**:
- Flexible schema accommodates various event types
- Fast time-range queries for activity feeds
- Can store complex nested data without schema changes
- Analytics queries don't impact primary database performance

### Data Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ├─ Fast Reads ──> Supabase (recent_donations, activity_logs)
       │
       └─ CRUD Operations ──> Backend API
                                │
                                ├─> MySQL (authoritative writes)
                                │
                                └─> Sync ──> Supabase (summaries/logs)
```

### Sync Strategy

When a donation is created in MySQL:

1. **Write to MySQL**: Full donation record with all details
2. **Backend Event**: Trigger sync operation
3. **Sync to Supabase**: Extract summary fields (item_name, category, quantity, status, donor_id)
4. **No sensitive data**: User passwords, emails, personal info excluded

When a match is made:

1. **Write to MySQL**: Full match record
2. **Log to Supabase**: Event logged in `activity_logs` with JSONB data
3. **Update Summary**: Update `recent_donations` status if needed

### Why This Architecture?

#### Performance Benefits

1. **Read Optimization**: Supabase tables are denormalized and indexed for specific query patterns
2. **Load Distribution**: Analytics queries don't impact MySQL performance
3. **Fast Frontend**: Home page and dashboards query Supabase instead of MySQL

#### Reliability Benefits

1. **Redundancy**: Critical summary data backed up in Supabase
2. **Disaster Recovery**: Can rebuild summaries from MySQL if needed
3. **Separation of Concerns**: Operational data (MySQL) vs. analytical data (Supabase)

#### Scalability Benefits

1. **Independent Scaling**: MySQL and Supabase can scale independently
2. **Query Optimization**: Each database optimized for its use case
3. **Future Flexibility**: Easy to add more analytics tables without MySQL schema changes

### Security Considerations

- **No Sensitive Data**: Passwords, emails, and personal information never stored in Supabase
- **Read-Only from Frontend**: Frontend can only read from Supabase, never write
- **Backend Control**: All writes go through backend API with authentication
- **Data Minimization**: Only necessary summary fields synced to Supabase

---

## Summary

The dual-database architecture provides:

- **MySQL (3NF)**: Reliable, normalized, authoritative data storage
- **Supabase**: Fast, flexible, analytics-optimized read layer

This design balances:
- **Data Integrity** (MySQL 3NF)
- **Performance** (Supabase optimized indexes)
- **Flexibility** (JSONB for variable data)
- **Security** (No sensitive data in Supabase)
- **Scalability** (Independent database scaling)

