# BRAC University Portal - Database Setup Guide

## Supabase Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a database password
4. Wait for the project to be ready

### 2. Execute Database Schema
Copy and paste the following SQL into your Supabase SQL Editor:

```sql
-- Create core enums
create type public.app_role as enum ('admin', 'faculty', 'student');
create type public.club_role as enum ('member', 'admin');
create type public.event_status as enum ('scheduled', 'cancelled', 'completed');
create type public.registration_status as enum ('registered', 'cancelled', 'waitlisted');
create type public.conversation_type as enum ('direct', 'group');

-- Utility function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Role helper (security definer to avoid recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Event validation trigger
create or replace function public.validate_event_times()
returns trigger
language plpgsql
as $$
begin
  if NEW.end_at <= NEW.start_at then
    raise exception 'end_at must be after start_at';
  end if;
  return NEW;
end;
$$;

-- Continue with all the table creation, RLS policies, and triggers from the provided schema...
```

### 3. Get Environment Variables
1. Go to Project Settings > API
2. Copy the Project URL and anon public key
3. Update your `.env` file:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Authentication Setup
The project now uses real Supabase authentication:
- Users must register with valid email addresses
- Email verification is required
- Roles are assigned during registration
- All data is stored in PostgreSQL

### 5. Features Available
- ✅ Real user authentication
- ✅ Email verification
- ✅ Role-based access (Student, Faculty, Admin)
- ✅ Event management by faculty
- ✅ Club discovery and membership
- ✅ Forum discussions
- ✅ Real-time updates
- ✅ File storage for resources

### 6. Default Admin Setup
To create the first admin user:
1. Register normally through the signup form
2. In Supabase dashboard, go to Authentication > Users
3. Find your user and note the User ID
4. In SQL Editor, run:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id-here', 'admin');
```

### 7. Testing the Application
1. Start the development server: `npm run dev`
2. Register a new account with a real email
3. Check your email for verification
4. Login and test all features

## Notes
- All fake/demo data has been removed
- Real database operations throughout the app
- Proper error handling and loading states
- Security policies implemented via Row Level Security (RLS)
