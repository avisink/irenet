# ireNet Database Design Documentation

## Executive Summary

**ireNet** is a full-stack food waste reduction and redistribution platform that connects food donors with organizations serving those in need. The application addresses the critical social problem of food waste while fighting food insecurity.

## Social Problem Statement

### The Challenge
- **30-40%** of the food supply is wasted annually in developed countries
- **1 in 8** people face food insecurity globally
- Lack of efficient coordination between food surplus and food needs
- Organizations struggle to find reliable donation sources

### Our Solution
ireNet bridges this gap by:
- Providing a centralized platform for food donation coordination
- Matching donors with organizations based on category and availability
- Tracking donation lifecycle from listing to delivery
- Building sustainable community connections

---

## Database Architecture

### System Overview
ireNet implements a **three-tier architecture**:

```
Frontend (React) → Backend (Supabase Edge Functions) → Database (PostgreSQL + KV Store)
```

### Dual Database Strategy

#### 1. Primary Database: PostgreSQL (Relational - 3NF)
- **Purpose**: Main data storage with referential integrity
- **Normalized to 3rd Normal Form** for data consistency
- **ACID compliance** for transaction safety
- **Foreign key constraints** for data integrity

#### 2. Secondary Database: KV Store (NoSQL)
- **Purpose**: Data redundancy and caching
- **Key-value pairs** for fast lookups
- **Asynchronous synchronization** from primary database
- **Fallback mechanism** for high availability

---

## Entity-Relationship Diagram (ERD)

### Entities and Relationships

```
USERS (1) ──────────── (1) ORGANIZATIONS
  │
  │ (1:N)
  │
DONATIONS (N) ──── (N:M via MATCHES) ──── (N) REQUESTS
                                              │
                                              │ (N:1)
                                              │
                                        ORGANIZATIONS
```

---

## Database Schema (3rd Normal Form)

### 1. USERS Table
**Purpose**: Store user account information for authentication and authorization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| name | VARCHAR(255) | NOT NULL | Full name of user |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email for authentication |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password (managed by Supabase Auth) |
| role | VARCHAR(50) | NOT NULL, CHECK | User role: 'donor', 'organization', or 'admin' |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |

**Normalization Analysis**:
- ✅ **1NF**: All attributes are atomic (no repeating groups)
- ✅ **2NF**: No partial dependencies (user_id is the only candidate key)
- ✅ **3NF**: No transitive dependencies (all non-key attributes depend only on user_id)

---

### 2. ORGANIZATIONS Table
**Purpose**: Store organization-specific information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| org_id | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| user_id | INTEGER | UNIQUE, NOT NULL, FOREIGN KEY → USERS(user_id) | One-to-one relationship with users |
| org_name | VARCHAR(255) | NOT NULL | Official organization name |
| contact_info | TEXT | NULL | Contact details (phone, address) |
| created_at | TIMESTAMP | DEFAULT NOW() | Organization registration timestamp |

**Relationship**: 1:1 with USERS (one organization account per user)

**Normalization Analysis**:
- ✅ **1NF**: All attributes are atomic
- ✅ **2NF**: No partial dependencies
- ✅ **3NF**: No transitive dependencies (org_name and contact_info depend only on org_id, not on user_id indirectly)

**Design Decision**: Separate table rather than a column in USERS because:
- Organization data is only relevant for organization-type users
- Avoids NULL values for donor users
- Allows easy extension of organization-specific attributes

---

### 3. DONATIONS Table
**Purpose**: Track food items offered by donors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| donation_id | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| donor_id | INTEGER | NOT NULL, FOREIGN KEY → USERS(user_id) | Reference to donor user |
| item_name | VARCHAR(255) | NOT NULL | Name of donated food item |
| category | VARCHAR(100) | NOT NULL | Food category for matching |
| quantity | INTEGER | NOT NULL | Number of items/units |
| status | VARCHAR(50) | DEFAULT 'available', CHECK | Status: 'available', 'matched', 'delivered', 'cancelled' |
| created_at | TIMESTAMP | DEFAULT NOW() | Donation listing timestamp |

**Relationship**: N:1 with USERS (one donor can create many donations)

**Normalization Analysis**:
- ✅ **1NF**: All attributes are atomic
- ✅ **2NF**: No partial dependencies
- ✅ **3NF**: No transitive dependencies (all attributes depend only on donation_id)

**Status Lifecycle**:
1. **available** → Listed and ready for matching
2. **matched** → Paired with a request
3. **delivered** → Successfully transferred to organization
4. **cancelled** → Withdrawn by donor

---

### 4. REQUESTS Table
**Purpose**: Track food items needed by organizations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| request_id | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| org_id | INTEGER | NOT NULL, FOREIGN KEY → ORGANIZATIONS(org_id) | Reference to requesting organization |
| item_name | VARCHAR(255) | NOT NULL | Name of requested food item |
| category | VARCHAR(100) | NOT NULL | Food category for matching |
| quantity | INTEGER | NOT NULL | Number of items/units needed |
| status | VARCHAR(50) | DEFAULT 'open', CHECK | Status: 'open', 'matched', 'fulfilled', 'cancelled' |
| created_at | TIMESTAMP | DEFAULT NOW() | Request creation timestamp |

**Relationship**: N:1 with ORGANIZATIONS (one organization can create many requests)

**Normalization Analysis**:
- ✅ **1NF**: All attributes are atomic
- ✅ **2NF**: No partial dependencies
- ✅ **3NF**: No transitive dependencies (all attributes depend only on request_id)

**Status Lifecycle**:
1. **open** → Actively seeking donations
2. **matched** → Paired with a donation
3. **fulfilled** → Completed and received
4. **cancelled** → Withdrawn or expired

---

### 5. MATCHES Table
**Purpose**: Bridge table for many-to-many relationship between donations and requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| match_id | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| donation_id | INTEGER | NOT NULL, FOREIGN KEY → DONATIONS(donation_id) | Reference to matched donation |
| request_id | INTEGER | NOT NULL, FOREIGN KEY → REQUESTS(request_id) | Reference to matched request |
| match_date | TIMESTAMP | DEFAULT NOW() | When the match was created |
| UNIQUE(donation_id, request_id) | | COMPOSITE UNIQUE | Prevents duplicate matches |

**Relationship**: N:M between DONATIONS and REQUESTS (junction table)

**Normalization Analysis**:
- ✅ **1NF**: All attributes are atomic
- ✅ **2NF**: No partial dependencies (match_date depends on the entire composite key)
- ✅ **3NF**: No transitive dependencies

**Design Decision**: Pure junction table without additional attributes to maintain normalization

---

## 3rd Normal Form Compliance

### First Normal Form (1NF) ✅
**Rule**: All attributes must contain atomic values; no repeating groups

**Compliance**:
- All tables have atomic columns (no arrays or nested structures)
- No repeating groups (e.g., contact_info is a single TEXT field, not multiple phone columns)
- Each row is unique via primary keys

### Second Normal Form (2NF) ✅
**Rule**: Must be in 1NF, and all non-key attributes must depend on the entire primary key

**Compliance**:
- All tables use single-column primary keys (SERIAL)
- No partial dependencies exist (not applicable with single-column PKs)
- Foreign keys establish proper relationships

### Third Normal Form (3NF) ✅
**Rule**: Must be in 2NF, and no transitive dependencies (non-key attributes depending on other non-key attributes)

**Compliance**:
- **USERS**: name, email, role depend only on user_id
- **ORGANIZATIONS**: org_name, contact_info depend only on org_id (user_id is a reference, not a dependency)
- **DONATIONS**: item_name, category, quantity, status depend only on donation_id
- **REQUESTS**: item_name, category, quantity, status depend only on request_id
- **MATCHES**: match_date depends on the match itself, not transitively

---

## Data Synchronization Strategy

### Primary → Secondary (PostgreSQL → KV Store)

```javascript
async function syncToKV(table: string, id: string | number, data: any) {
  try {
    await kv.set(`${table}:${id}`, JSON.stringify(data));
  } catch (error) {
    console.error(`KV sync error for ${table}:${id}:`, error);
  }
}
```

### Synchronization Points
1. **After INSERT**: New records synced to KV store
2. **After UPDATE**: Modified records updated in KV store
3. **After DELETE**: Corresponding KV entries removed

### Key Naming Convention
```
users:123          → User with user_id=123
donations:456      → Donation with donation_id=456
organizations:789  → Organization with org_id=789
requests:101       → Request with request_id=101
matches:202        → Match with match_id=202
```

### Benefits of Dual Storage
- **Redundancy**: Data survives if primary database has issues
- **Performance**: KV store provides fast lookups for read-heavy operations
- **Flexibility**: NoSQL structure allows for denormalized views
- **Scalability**: Distributed caching capabilities

---

## CRUD Operations

### Complete CRUD Support

#### Users
- ✅ **Create**: Signup (POST /auth/signup)
- ✅ **Read**: Get current user (GET /users/me)
- ✅ **Update**: (Implicit via Supabase Auth)
- ✅ **Delete**: (Implicit via Supabase Auth cascade)

#### Donations
- ✅ **Create**: POST /donations
- ✅ **Read**: GET /donations, GET /donations/my
- ✅ **Update**: PATCH /donations/:id
- ✅ **Delete**: DELETE /donations/:id

#### Requests
- ✅ **Create**: POST /requests
- ✅ **Read**: GET /requests, GET /requests/my
- ✅ **Update**: PATCH /requests/:id
- ✅ **Delete**: DELETE /requests/:id

#### Matches
- ✅ **Create**: POST /matches
- ✅ **Read**: GET /matches, GET /matches/my
- ✅ **Update**: (Status updated via donation/request updates)
- ✅ **Delete**: (Cascade delete via foreign keys)

---

## Technology Stack

### Backend
- **Runtime**: Deno (Supabase Edge Functions)
- **Framework**: Hono (lightweight web framework)
- **Database**: PostgreSQL (Supabase)
- **NoSQL**: Key-Value Store (Supabase built-in)
- **Authentication**: Supabase Auth

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API

### Database Constraints
- **Primary Keys**: Auto-incrementing SERIAL
- **Foreign Keys**: ON DELETE CASCADE for data integrity
- **Unique Constraints**: Prevent duplicate emails, duplicate matches
- **Check Constraints**: Enforce valid status values
- **NOT NULL**: Ensure required fields are populated

---

## Security Considerations

### Authentication
- Password hashing via Supabase Auth
- JWT-based session management
- Role-based access control (RBAC)

### Authorization
- Protected routes require access tokens
- User can only modify their own donations/requests
- Organizations can only create requests (not donations)
- Donors can only create donations (not requests)

### Data Validation
- Input sanitization on backend
- Type checking with TypeScript
- Database constraints enforce data integrity

---

## Future Enhancements

### Database Improvements
1. **Full-text search** on item_name and category
2. **Geospatial indexing** for location-based matching
3. **Audit logs** table for tracking changes
4. **Ratings/Reviews** system for donors and organizations
5. **Delivery tracking** with status updates
6. **Expiration dates** for perishable items

### Performance Optimizations
1. Database indexing on frequently queried columns
2. Connection pooling for scalability
3. Redis caching layer for hot data
4. CDN for static assets

### Analytics
1. Dashboard for admin statistics
2. Impact reports (food saved, people helped)
3. Donation trends over time
4. Category popularity analysis

---

## Conclusion

ireNet successfully implements a **3NF-compliant relational database** with **NoSQL redundancy** to solve the real-world problem of food waste and insecurity. The architecture ensures data integrity, scalability, and maintainability while providing a user-friendly interface for donors and organizations to connect and make a difference.

**Key Achievements**:
✅ Properly normalized database design (3NF)
✅ Complete CRUD operations for all entities
✅ Dual database strategy (SQL + NoSQL)
✅ User authentication and authorization
✅ Full-stack implementation with modern tech stack
✅ Addresses genuine social problem with measurable impact
