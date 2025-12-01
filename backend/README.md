# ireNet Backend API

This is the backend API server for the ireNet Social Donation Matching App.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Supabase sync
- **Authentication**: Supabase Auth

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=irenet_db
PORT=5001
```

3. Set up the database:
```bash
# Run the database setup SQL
mysql -u root -p < config/database-setup.sql
```

4. Start the server:
```bash
node server.js
```

The API will be available at [http://localhost:5001](http://localhost:5001)

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - User management
- `GET /api/donations` - Donation management
- `GET /api/requests` - Request management
- `GET /api/matches` - Match management
- `GET /api/organizations` - Organization management

## Database Schema

The MySQL database follows 3NF normalization with the following main tables:
- `users` - User accounts and authentication
- `organizations` - Organization profiles
- `donations` - Food donation listings
- `requests` - Food request listings
- `matches` - Connections between donations and requests