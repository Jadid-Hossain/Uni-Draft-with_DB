-- SAFE Manual Authentication Schema for BRAC University Portal
-- This version avoids touching the auth schema and works only with public schema
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Enable required extensions
create extension if not exists pgcrypto;

-- Step 2: Create enums only if they don't exist
do $$ begin
    create type public.app_role as enum ('admin', 'faculty', 'student');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type public.club_role as enum ('member', 'admin');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type public.event_status as enum ('scheduled', 'cancelled', 'completed');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type public.registration_status as enum ('registered', 'cancelled', 'waitlisted');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type public.conversation_type as enum ('direct', 'group');
exception
    when duplicate_object then null;
end $$;

-- Step 3: Create utility functions
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- Step 4: Create session context functions first (needed for RLS)
create or replace function public.set_session_context(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', user_id::text, true);
end;
$$;

create or replace function public.clear_session_context()
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', '', true);
end;
$$;

-- Step 5: Safely drop and recreate our tables
drop table if exists public.user_roles cascade;
drop table if exists public.user_sessions cascade;

-- Safely handle profiles table
do $$
begin
    -- Try to drop the foreign key constraint on profiles if it exists
    alter table public.profiles drop constraint if exists profiles_id_fkey;
exception
    when others then null;
end $$;

drop table if exists public.profiles cascade;

-- Step 6: Create the main users table
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  department text not null,
  student_id text unique,
  employee_id text unique,
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz,
  
  -- Constraints
  constraint users_email_check check (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'),
  constraint users_role_id_check check (
    (role = 'student' and student_id is not null and employee_id is null) or
    (role in ('faculty', 'admin') and employee_id is not null and student_id is null)
  )
);

-- Step 7: Create profiles table
create table public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 8: Create sessions table
create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now()
);

-- Step 9: Create indexes
create index idx_users_email on public.users(email);
create index idx_users_student_id on public.users(student_id) where student_id is not null;
create index idx_users_employee_id on public.users(employee_id) where employee_id is not null;
create index idx_user_sessions_token on public.user_sessions(session_token);
create index idx_user_sessions_user_id on public.user_sessions(user_id);
create index idx_user_sessions_expires on public.user_sessions(expires_at);

-- Step 10: Create role helper function
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return exists (
    select 1 from public.users
    where id = _user_id and role = _role and is_active = true
  );
end;
$$;

-- Step 11: Create authentication functions
create or replace function public.hash_password(password text)
returns text
language sql
security definer
as $$
  select crypt(password, gen_salt('bf', 8));
$$;

create or replace function public.verify_password(password text, password_hash text)
returns boolean
language sql
security definer
as $$
  select password_hash = crypt(password, password_hash);
$$;

-- Step 12: Create user management functions
create or replace function public.create_user(
  user_email text,
  user_password text,
  user_full_name text,
  user_department text,
  user_student_id text default null,
  user_employee_id text default null,
  user_role public.app_role default 'student'
)
returns json
language plpgsql
security definer
as $$
declare
  new_user_id uuid;
  password_hash text;
begin
  -- Validate input
  if user_email is null or user_password is null or user_full_name is null or user_department is null then
    return json_build_object('success', false, 'error', 'Missing required fields');
  end if;
  
  -- Check if email already exists
  if exists (select 1 from public.users where email = user_email) then
    return json_build_object('success', false, 'error', 'Email already registered');
  end if;
  
  -- Check if student_id already exists (if provided)
  if user_student_id is not null and exists (select 1 from public.users where student_id = user_student_id) then
    return json_build_object('success', false, 'error', 'Student ID already registered');
  end if;
  
  -- Check if employee_id already exists (if provided)
  if user_employee_id is not null and exists (select 1 from public.users where employee_id = user_employee_id) then
    return json_build_object('success', false, 'error', 'Employee ID already registered');
  end if;
  
  -- Validate role-specific requirements
  if user_role = 'student' and user_student_id is null then
    return json_build_object('success', false, 'error', 'Student ID required for student role');
  end if;
  
  if user_role in ('faculty', 'admin') and user_employee_id is null then
    return json_build_object('success', false, 'error', 'Employee ID required for faculty/admin role');
  end if;
  
  -- Hash password
  password_hash := public.hash_password(user_password);
  
  -- Create user
  insert into public.users (
    email, password_hash, full_name, department, student_id, employee_id, role
  ) values (
    user_email, password_hash, user_full_name, user_department, user_student_id, user_employee_id, user_role
  ) returning id into new_user_id;
  
  -- Create profile
  insert into public.profiles (id) values (new_user_id);
  
  return json_build_object(
    'success', true,
    'user_id', new_user_id,
    'message', 'User created successfully'
  );
end;
$$;

-- Step 13: Create authentication function
create or replace function public.authenticate_user(user_email text, user_password text)
returns json
language plpgsql
security definer
as $$
declare
  user_record public.users%rowtype;
  session_token text;
  session_expires timestamptz;
begin
  -- Find user
  select * into user_record
  from public.users
  where email = user_email and is_active = true;
  
  if not found then
    return json_build_object('success', false, 'error', 'Invalid credentials');
  end if;
  
  -- Verify password
  if not public.verify_password(user_password, user_record.password_hash) then
    return json_build_object('success', false, 'error', 'Invalid credentials');
  end if;
  
  -- Create session
  session_token := encode(gen_random_bytes(32), 'hex');
  session_expires := now() + interval '7 days';
  
  insert into public.user_sessions (user_id, session_token, expires_at)
  values (user_record.id, session_token, session_expires);
  
  -- Update last login
  update public.users 
  set last_login_at = now()
  where id = user_record.id;
  
  return json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'full_name', user_record.full_name,
      'department', user_record.department,
      'student_id', user_record.student_id,
      'employee_id', user_record.employee_id,
      'role', user_record.role,
      'is_active', user_record.is_active,
      'email_verified', user_record.email_verified
    ),
    'session_token', session_token,
    'expires_at', session_expires
  );
end;
$$;

-- Step 14: Create session validation function
create or replace function public.validate_session(token text)
returns json
language plpgsql
security definer
as $$
declare
  session_record public.user_sessions%rowtype;
  user_record public.users%rowtype;
begin
  -- Find valid session
  select * into session_record
  from public.user_sessions
  where session_token = token and expires_at > now();
  
  if not found then
    return json_build_object('success', false, 'error', 'Invalid or expired session');
  end if;
  
  -- Get user data
  select * into user_record
  from public.users
  where id = session_record.user_id and is_active = true;
  
  if not found then
    return json_build_object('success', false, 'error', 'User not found or inactive');
  end if;
  
  -- Update last accessed
  update public.user_sessions
  set last_accessed_at = now()
  where id = session_record.id;
  
  return json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'full_name', user_record.full_name,
      'department', user_record.department,
      'student_id', user_record.student_id,
      'employee_id', user_record.employee_id,
      'role', user_record.role,
      'is_active', user_record.is_active,
      'email_verified', user_record.email_verified
    )
  );
end;
$$;

-- Step 15: Create logout function
create or replace function public.logout_user(token text)
returns json
language plpgsql
security definer
as $$
begin
  delete from public.user_sessions where session_token = token;
  return json_build_object('success', true, 'message', 'Logged out successfully');
end;
$$;

-- Step 16: Update existing table foreign keys (safely)
do $$ 
begin
    -- Update clubs table
    begin
        alter table public.clubs drop constraint if exists clubs_created_by_fkey;
        alter table public.clubs add constraint clubs_created_by_fkey 
            foreign key (created_by) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update events table  
    begin
        alter table public.events drop constraint if exists events_created_by_fkey;
        alter table public.events add constraint events_created_by_fkey 
            foreign key (created_by) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update club_memberships table
    begin
        alter table public.club_memberships drop constraint if exists club_memberships_user_id_fkey;
        alter table public.club_memberships add constraint club_memberships_user_id_fkey 
            foreign key (user_id) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update event_registrations table
    begin
        alter table public.event_registrations drop constraint if exists event_registrations_user_id_fkey;
        alter table public.event_registrations add constraint event_registrations_user_id_fkey 
            foreign key (user_id) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update forum_threads table
    begin
        alter table public.forum_threads drop constraint if exists forum_threads_created_by_fkey;
        alter table public.forum_threads add constraint forum_threads_created_by_fkey 
            foreign key (created_by) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update forum_posts table
    begin
        alter table public.forum_posts drop constraint if exists forum_posts_created_by_fkey;
        alter table public.forum_posts add constraint forum_posts_created_by_fkey 
            foreign key (created_by) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update conversations table
    begin
        alter table public.conversations drop constraint if exists conversations_created_by_fkey;
        alter table public.conversations add constraint conversations_created_by_fkey 
            foreign key (created_by) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update conversation_members table
    begin
        alter table public.conversation_members drop constraint if exists conversation_members_user_id_fkey;
        alter table public.conversation_members add constraint conversation_members_user_id_fkey 
            foreign key (user_id) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update messages table
    begin
        alter table public.messages drop constraint if exists messages_sender_id_fkey;
        alter table public.messages add constraint messages_sender_id_fkey 
            foreign key (sender_id) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;

    -- Update resources table
    begin
        alter table public.resources drop constraint if exists resources_uploaded_by_fkey;
        alter table public.resources add constraint resources_uploaded_by_fkey 
            foreign key (uploaded_by) references public.users(id) on delete cascade;
    exception when others then
        null;
    end;
end $$;

-- Step 17: Create remaining tables if they don't exist
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  is_public boolean not null default true,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.club_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  capacity integer,
  status public.event_status not null default 'scheduled',
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  content text,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  content text not null,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  name text,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  bucket_id text not null default 'resources',
  file_path text not null,
  uploaded_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Step 18: Enable RLS on all tables
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.user_sessions enable row level security;
alter table public.clubs enable row level security;
alter table public.club_memberships enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.resources enable row level security;

-- Step 19: Drop all existing policies safely
do $$ 
declare
    pol record;
begin
    for pol in 
        select schemaname, tablename, policyname 
        from pg_policies 
        where schemaname = 'public'
    loop
        execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    end loop;
exception
    when others then null;
end $$;

-- Step 20: Create RLS policies
-- Users table policies
create policy "Users can view their own data" on public.users 
    for select using (id = current_setting('app.current_user_id', true)::uuid);

create policy "Admins can view all users" on public.users 
    for select using (public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin'));

create policy "Users can update their own data" on public.users 
    for update using (id = current_setting('app.current_user_id', true)::uuid);

-- Profiles table policies  
create policy "Profiles are viewable by everyone" on public.profiles 
    for select using (true);

create policy "Users can insert their own profile" on public.profiles 
    for insert with check (id = current_setting('app.current_user_id', true)::uuid);

create policy "Users can update their own profile" on public.profiles 
    for update using (id = current_setting('app.current_user_id', true)::uuid);

-- Sessions table policies
create policy "Users can view their own sessions" on public.user_sessions 
    for select using (user_id = current_setting('app.current_user_id', true)::uuid);

-- Clubs table policies
create policy "Clubs are viewable by everyone" on public.clubs 
    for select using (true);

create policy "Authenticated users can create clubs" on public.clubs 
    for insert with check (created_by = current_setting('app.current_user_id', true)::uuid);

create policy "Owners or admins can update clubs" on public.clubs 
    for update using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Owners or admins can delete clubs" on public.clubs 
    for delete using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Club memberships policies
create policy "Members or admins can view memberships" on public.club_memberships 
    for select using (
        user_id = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Users can join clubs" on public.club_memberships 
    for insert with check (user_id = current_setting('app.current_user_id', true)::uuid);

create policy "Users or admins can leave clubs" on public.club_memberships 
    for delete using (
        user_id = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Events table policies
create policy "Events are viewable by everyone" on public.events 
    for select using (true);

create policy "Authenticated users can create events" on public.events 
    for insert with check (created_by = current_setting('app.current_user_id', true)::uuid);

create policy "Creators or admins can update events" on public.events 
    for update using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Creators or admins can delete events" on public.events 
    for delete using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Event registrations policies
create policy "Users can view relevant registrations" on public.event_registrations 
    for select using (
        user_id = current_setting('app.current_user_id', true)::uuid or
        exists (select 1 from public.events e where e.id = event_id and e.created_by = current_setting('app.current_user_id', true)::uuid) or
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Users can register themselves" on public.event_registrations 
    for insert with check (user_id = current_setting('app.current_user_id', true)::uuid);

create policy "Users or admins can update registrations" on public.event_registrations 
    for update using (
        user_id = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Users or admins can delete registrations" on public.event_registrations 
    for delete using (
        user_id = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Forum threads policies
create policy "Threads are viewable by everyone" on public.forum_threads 
    for select using (true);

create policy "Authenticated users can create threads" on public.forum_threads 
    for insert with check (created_by = current_setting('app.current_user_id', true)::uuid);

create policy "Owners or admins can update threads" on public.forum_threads 
    for update using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Owners or admins can delete threads" on public.forum_threads 
    for delete using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Forum posts policies
create policy "Posts are viewable by everyone" on public.forum_posts 
    for select using (true);

create policy "Authenticated users can create posts" on public.forum_posts 
    for insert with check (created_by = current_setting('app.current_user_id', true)::uuid);

create policy "Owners or admins can update posts" on public.forum_posts 
    for update using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Owners or admins can delete posts" on public.forum_posts 
    for delete using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Conversations policies
create policy "Members or admins can view conversations" on public.conversations 
    for select using (
        exists (
            select 1 from public.conversation_members m
            where m.conversation_id = id and m.user_id = current_setting('app.current_user_id', true)::uuid
        ) or public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Authenticated users can create conversations" on public.conversations 
    for insert with check (created_by = current_setting('app.current_user_id', true)::uuid);

create policy "Creators or admins can update conversations" on public.conversations 
    for update using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Creators or admins can delete conversations" on public.conversations 
    for delete using (
        created_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Conversation members policies
create policy "Users can view their conversation memberships" on public.conversation_members 
    for select using (
        user_id = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Users can add themselves to conversations" on public.conversation_members 
    for insert with check (user_id = current_setting('app.current_user_id', true)::uuid);

create policy "Users or admins can remove memberships" on public.conversation_members 
    for delete using (
        user_id = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Messages policies
create policy "Members or admins can view messages" on public.messages 
    for select using (
        exists (
            select 1 from public.conversation_members m
            where m.conversation_id = messages.conversation_id 
            and m.user_id = current_setting('app.current_user_id', true)::uuid
        ) or public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

create policy "Members can send messages" on public.messages 
    for insert with check (
        sender_id = current_setting('app.current_user_id', true)::uuid and 
        exists (
            select 1 from public.conversation_members m
            where m.conversation_id = messages.conversation_id 
            and m.user_id = current_setting('app.current_user_id', true)::uuid
        )
    );

create policy "Senders or admins can delete messages" on public.messages 
    for delete using (
        sender_id = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Resources policies
create policy "Resources are viewable by everyone" on public.resources 
    for select using (true);

create policy "Authenticated users can upload resources" on public.resources 
    for insert with check (uploaded_by = current_setting('app.current_user_id', true)::uuid);

create policy "Owners or admins can delete resources" on public.resources 
    for delete using (
        uploaded_by = current_setting('app.current_user_id', true)::uuid or 
        public.has_role(current_setting('app.current_user_id', true)::uuid, 'admin')
    );

-- Step 21: Create triggers
drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at 
    before update on public.users 
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at 
    before update on public.profiles 
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_clubs_updated_at on public.clubs;
create trigger trg_clubs_updated_at 
    before update on public.clubs 
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at 
    before update on public.events 
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_forum_threads_updated_at on public.forum_threads;
create trigger trg_forum_threads_updated_at 
    before update on public.forum_threads 
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_forum_posts_updated_at on public.forum_posts;
create trigger trg_forum_posts_updated_at 
    before update on public.forum_posts 
    for each row execute function public.update_updated_at_column();

drop trigger if exists trg_events_validate on public.events;
create trigger trg_events_validate 
    before insert or update on public.events 
    for each row execute function public.validate_event_times();

-- Step 22: Create initial admin user (uncomment and modify as needed)
-- insert into public.users (email, password_hash, full_name, department, employee_id, role)
-- values ('admin@g.bracu.ac.bd', public.hash_password('your_secure_password'), 'System Administrator', 'IT Department', 'EMP001', 'admin');

-- Step 23: Create cleanup function for expired sessions
create or replace function public.cleanup_expired_sessions()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.user_sessions where expires_at < now();
end;
$$;

-- Final success message
select 'SAFE Manual authentication system deployed successfully!' as status,
       'All auth schema conflicts avoided' as safety,
       'You can now create users and authenticate manually' as message,
       'Remember to create an admin user if needed' as reminder;
