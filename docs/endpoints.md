# API Endpoints Documentation

This document outlines all API endpoints for the ireNet platform, organized by functionality.

## Authentication Endpoints

### POST `/api/auth/register`
Register a new user (donor or organization). Creates a user account and optionally an organization profile if role is 'organization'.

### POST `/api/auth/login`
Authenticate user and return JWT token for subsequent authenticated requests.

### POST `/api/auth/logout`
Logout current user and invalidate their session/token.

### GET `/api/auth/me`
Get the currently authenticated user's profile information.

---

## User Management Endpoints

### GET `/api/users`
Get all users (admin only) - Returns list of all registered users with their roles.

### GET `/api/users/:id`
Get a specific user by ID - Returns user profile information excluding sensitive data.

### POST `/api/users`
Create a new user account - Used during registration to create donor or organization accounts.

### PATCH `/api/users/:id`
Update user profile information - Allows users to update their own profile or admins to update any profile.

### DELETE `/api/users/:id`
Delete a user account - Admin only, removes user and associated data.

---

## Organization Endpoints

### GET `/api/organizations`
Get all organizations - Returns list of all registered nonprofit organizations.

### GET `/api/organizations/:id`
Get a specific organization by ID - Returns organization details including contact information.

### POST `/api/organizations`
Create a new organization profile - Links an organization profile to a user account.

### PATCH `/api/organizations/:id`
Update organization information - Allows organizations to update their profile details.

### DELETE `/api/organizations/:id`
Delete an organization - Admin only, removes organization and associated requests.

---

## Donation Endpoints

### GET `/api/donations`
Get all donations - Returns all donation posts with donor information for browsing.

### GET `/api/donations/:id`
Get a specific donation by ID - Returns detailed information about a single donation.

### GET `/api/donations/status/:status`
Get donations by status - Filter donations by status (available, matched, delivered, cancelled).

### GET `/api/donations/donor/:donor_id`
Get donations by donor - Returns all donations made by a specific donor for their dashboard.

### GET `/api/donations/category/:category`
Get donations by category - Filter donations by item category for easier browsing.

### POST `/api/donations`
Create a new donation - Allows donors to post available items, triggers sync to Supabase.

### PATCH `/api/donations/:id`
Update donation status or details - Allows donors to update their donation posts or admins to change status.

### DELETE `/api/donations/:id`
Delete a donation - Allows donors to remove their donation posts.

---

## Request Endpoints

### GET `/api/requests`
Get all requests - Returns all item requests made by organizations for browsing.

### GET `/api/requests/:id`
Get a specific request by ID - Returns detailed information about a single request.

### GET `/api/requests/status/:status`
Get requests by status - Filter requests by status (open, matched, fulfilled, cancelled).

### GET `/api/requests/organization/:org_id`
Get requests by organization - Returns all requests made by a specific organization for their dashboard.

### GET `/api/requests/category/:category`
Get requests by category - Filter requests by item category to help donors find relevant needs.

### POST `/api/requests`
Create a new request - Allows organizations to post item needs, optionally syncs to Supabase.

### PATCH `/api/requests/:id`
Update request status or details - Allows organizations to update their requests or admins to change status.

### DELETE `/api/requests/:id`
Delete a request - Allows organizations to remove their request posts.

---

## Match Endpoints

### GET `/api/matches`
Get all matches - Returns all successful matches between donations and requests with full details.

### GET `/api/matches/:id`
Get a specific match by ID - Returns detailed information about a single match.

### GET `/api/matches/donation/:donation_id`
Get matches for a donation - Returns all matches associated with a specific donation.

### GET `/api/matches/request/:request_id`
Get matches for a request - Returns all matches associated with a specific request.

### POST `/api/matches`
Create a new match - Links a donation to a request, updates both statuses to 'matched', and logs to Supabase activity_logs.

### PATCH `/api/matches/:id`
Update match status - Allows admins to mark matches as completed or update match details.

### DELETE `/api/matches/:id`
Delete a match - Admin only, removes a match and reverts donation/request statuses.

---

## Analytics & Statistics Endpoints

### GET `/api/stats/dashboard`
Get dashboard statistics - Returns aggregated stats for home page (total donations, requests, matches, recent activity).

### GET `/api/stats/donations`
Get donation statistics - Returns analytics about donations (by category, status, time period).

### GET `/api/stats/requests`
Get request statistics - Returns analytics about requests (by category, status, time period).

### GET `/api/stats/matches`
Get match statistics - Returns analytics about successful matches (success rate, popular categories).

---

## Supabase Endpoints (Fast Reads)

### GET `/api/supabase/recent-donations`
Get recent donations from Supabase - Fast read endpoint for home page, returns denormalized donation summaries.

### GET `/api/supabase/recent-donations/category/:category`
Get recent donations by category from Supabase - Fast filtered read for category browsing.

### GET `/api/supabase/activity-logs`
Get activity logs from Supabase - Returns recent platform activity for activity feed page.

### GET `/api/supabase/activity-logs/type/:event_type`
Get activity logs by event type - Filter activity logs by event type (donation_created, match_made, etc.).

### GET `/api/supabase/popular-items`
Get popular requested items from Supabase - Returns aggregated data about most requested item categories.

---

## Health & Utility Endpoints

### GET `/`
Root endpoint - Returns API welcome message and basic information.

### GET `/api/health`
Health check endpoint - Verifies server and database connectivity for monitoring.

---

## Notes

- All endpoints that modify data require authentication (except registration/login)
- Admin-only endpoints require role-based authorization
- Donations and requests creation automatically trigger Supabase sync
- Match creation automatically logs to Supabase activity_logs
- Supabase endpoints are read-only and optimized for fast front-end queries
- All sensitive data (passwords, emails) is excluded from Supabase sync

