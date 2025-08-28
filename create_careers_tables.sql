-- Careers: jobs, internships, guidelines, and discussions
-- Run this in your Supabase SQL editor

create type if not exists public.career_type as enum ('job', 'internship', 'guideline', 'discussion');

create table if not exists public.careers_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type public.career_type not null default 'job',
  company text,
  location text,
  apply_url text,
  posted_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_careers_posts_type on public.careers_posts(type);
create index if not exists idx_careers_posts_created_at on public.careers_posts(created_at desc);

alter table public.careers_posts enable row level security;

-- RLS policies
do $$ begin
  perform 1 from pg_policies where polname = 'careers_read_all';
  if not found then
    create policy careers_read_all on public.careers_posts for select using (true);
  end if;
end $$;

do $$ begin
  perform 1 from pg_policies where polname = 'careers_insert_auth_only';
  if not found then
    create policy careers_insert_auth_only on public.careers_posts for insert with check (auth.uid() = posted_by);
  end if;
end $$;

do $$ begin
  perform 1 from pg_policies where polname = 'careers_update_own';
  if not found then
    create policy careers_update_own on public.careers_posts for update using (auth.uid() = posted_by);
  end if;
end $$;

do $$ begin
  perform 1 from pg_policies where polname = 'careers_delete_own_or_admin';
  if not found then
    create policy careers_delete_own_or_admin on public.careers_posts for delete using (
      auth.uid() = posted_by or exists (
        select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'
      )
    );
  end if;
end $$;


