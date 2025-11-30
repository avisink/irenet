# Supabase NoSQL Scripts

This document contains the SQL scripts used to set up the Supabase database tables for the ireNet project.

## Recent Donations Table

This table stores summaries of recent donations for fast front-end reads.

```sql
CREATE TABLE public.recent_donations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id integer NOT NULL,
    item_name text NOT NULL,
    category text NOT NULL,
    quantity integer NOT NULL,
    status text NOT NULL,
    donor_id integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recent_donations_created_at
ON public.recent_donations (created_at DESC);

CREATE INDEX idx_recent_donations_category
ON public.recent_donations (category);
```

## Activity Logs Table

This table stores activity logs and events in JSON format.

```sql
CREATE TABLE public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    data jsonb NOT NULL,
    timestamp timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_logs_timestamp
ON public.activity_logs (timestamp DESC);
```

