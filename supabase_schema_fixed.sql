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

-- Event validation trigger (use triggers instead of CHECK constraints)
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

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  department text,
  student_id text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User roles (CREATE THIS TABLE FIRST before the has_role function)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- NOW create the role helper function (after user_roles table exists)
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

-- Clubs and memberships
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  is_public boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.club_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

-- Events and registrations
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
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- Forum
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  title text not null,
  content text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  content text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  name text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Resources (metadata table for files stored in Storage)
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  bucket_id text not null default 'resources',
  file_path text not null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
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

-- RLS Policies
-- profiles
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- user_roles
create policy "Users can view their own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "Admins can view all roles (user_roles)" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles (insert)" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles (update)" on public.user_roles for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles (delete)" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- clubs
create policy "Clubs are viewable by everyone" on public.clubs for select using (true);
create policy "Users can create clubs" on public.clubs for insert to authenticated with check (created_by = auth.uid());
create policy "Owners or admins can update clubs" on public.clubs for update to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin')) with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Owners or admins can delete clubs" on public.clubs for delete to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- club_memberships
create policy "Members or admins can view memberships" on public.club_memberships for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users can join clubs" on public.club_memberships for insert to authenticated with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users or admins can leave/remove memberships" on public.club_memberships for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Only admins can change membership roles" on public.club_memberships for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- events
create policy "Events are viewable by everyone" on public.events for select using (true);
create policy "Users can create events" on public.events for insert to authenticated with check (created_by = auth.uid());
create policy "Creators or admins can update events" on public.events for update to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin')) with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Creators or admins can delete events" on public.events for delete to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- event_registrations
create policy "View own or owned-event registrations or admin" on public.event_registrations for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid())
  or public.has_role(auth.uid(), 'admin')
);
create policy "Users can register themselves" on public.event_registrations for insert to authenticated with check (user_id = auth.uid());
create policy "Users/admins can update their registrations" on public.event_registrations for update to authenticated using (
  user_id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
) with check (
  user_id = auth.uid() or public.has_role(auth.uid(), 'admin')
);
create policy "Users/admins can delete their registrations" on public.event_registrations for delete to authenticated using (
  user_id = auth.uid() or public.has_role(auth.uid(), 'admin')
);

-- forum_threads
create policy "Threads are viewable by everyone" on public.forum_threads for select using (true);
create policy "Users can create threads" on public.forum_threads for insert to authenticated with check (created_by = auth.uid());
create policy "Owners/admins can update threads" on public.forum_threads for update to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin')) with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Owners/admins can delete threads" on public.forum_threads for delete to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- forum_posts
create policy "Posts are viewable by everyone" on public.forum_posts for select using (true);
create policy "Users can create posts" on public.forum_posts for insert to authenticated with check (created_by = auth.uid());
create policy "Owners/admins can update posts" on public.forum_posts for update to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin')) with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Owners/admins can delete posts" on public.forum_posts for delete to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- conversations
create policy "Members/admins can view conversations" on public.conversations for select to authenticated using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = id and m.user_id = auth.uid()
  ) or public.has_role(auth.uid(), 'admin')
);
create policy "Users can create conversations" on public.conversations for insert to authenticated with check (created_by = auth.uid());
create policy "Creators/admins can modify conversations" on public.conversations for update to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin')) with check (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Creators/admins can delete conversations" on public.conversations for delete to authenticated using (created_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- conversation_members
create policy "Users can view their memberships" on public.conversation_members for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users can add themselves to conversations" on public.conversation_members for insert to authenticated with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users/admins can remove memberships" on public.conversation_members for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- messages
create policy "Members/admins can view messages" on public.messages for select to authenticated using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  ) or public.has_role(auth.uid(), 'admin')
);
create policy "Members can send messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  )
);
create policy "Senders/admins can delete messages" on public.messages for delete to authenticated using (sender_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- resources
create policy "Resources are viewable by everyone" on public.resources for select using (true);
create policy "Users can create resources" on public.resources for insert to authenticated with check (uploaded_by = auth.uid());
create policy "Owners/admins can delete resources" on public.resources for delete to authenticated using (uploaded_by = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Triggers
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger trg_clubs_updated_at before update on public.clubs for each row execute function public.update_updated_at_column();
create trigger trg_events_updated_at before update on public.events for each row execute function public.update_updated_at_column();
create trigger trg_forum_threads_updated_at before update on public.forum_threads for each row execute function public.update_updated_at_column();
create trigger trg_forum_posts_updated_at before update on public.forum_posts for each row execute function public.update_updated_at_column();

create trigger trg_events_validate before insert or update on public.events for each row execute function public.validate_event_times();

-- Storage buckets
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('resources','resources', false) on conflict (id) do nothing;

-- Storage policies (avatars - public read, user-owned write)
create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload their own avatar" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can update their own avatar" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can delete their own avatar" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies (resources - private to owner, admin can access)
create policy "Owners can read their resources" on storage.objects for select to authenticated using (
  bucket_id = 'resources' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Admins can read all resources" on storage.objects for select to authenticated using (
  bucket_id = 'resources' and public.has_role(auth.uid(), 'admin')
);
create policy "Owners can upload resources" on storage.objects for insert to authenticated with check (
  bucket_id = 'resources' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Owners/admins can update resources" on storage.objects for update to authenticated using (
  bucket_id = 'resources' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin'))
) with check (
  bucket_id = 'resources' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin'))
);
create policy "Owners/admins can delete resources" on storage.objects for delete to authenticated using (
  bucket_id = 'resources' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin'))
);

-- Realtime: ensure full row data and add to publication
alter table public.messages replica identity full;
alter table public.forum_posts replica identity full;
alter table public.event_registrations replica identity full;
alter table public.conversation_members replica identity full;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.forum_posts;
alter publication supabase_realtime add table public.event_registrations;
alter publication supabase_realtime add table public.conversation_members;
