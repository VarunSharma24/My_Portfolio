-- Varun Sharma portfolio schema. Run this migration in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_members enable row level security;
revoke all on public.admin_members from anon, authenticated;

create or replace function public.is_portfolio_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_members m where m.user_id = (select auth.uid()));
$$;
revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  display_name text not null default 'Varun Sharma' check (char_length(display_name) between 1 and 100),
  headline text not null default 'Developer · Application Security · AI Builder' check (char_length(headline) <= 180),
  introduction text not null default '' check (char_length(introduction) <= 1500),
  about text not null default '' check (char_length(about) <= 6000),
  public_email text check (public_email is null or char_length(public_email) <= 254),
  github_url text check (github_url is null or github_url ~ '^https://'),
  linkedin_url text check (linkedin_url is null or linkedin_url ~ '^https://'),
  social_links jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null default '' check (char_length(short_description) <= 280),
  description text not null default '' check (char_length(description) <= 12000),
  technologies text[] not null default '{}',
  github_url text check (github_url is null or github_url ~ '^https://'),
  live_url text check (live_url is null or live_url ~ '^https://'),
  image_path text,
  featured boolean not null default false,
  published boolean not null default false,
  display_order integer not null default 0 check (display_order between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_public_order on public.projects(published, display_order);

create table if not exists public.skill_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  display_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.skill_groups(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  display_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(group_id, name)
);
create index if not exists skills_group_order on public.skills(group_id, display_order);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  issuer text not null check (char_length(issuer) between 1 and 180),
  issue_date date,
  description text not null default '' check (char_length(description) <= 2000),
  file_path text,
  verification_url text check (verification_url is null or verification_url ~ '^https://'),
  published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists certifications_published on public.certifications(published, issue_date desc);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '' check (char_length(description) <= 3000),
  achievement_date date,
  image_path text,
  external_url text check (external_url is null or external_url ~ '^https://'),
  published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists achievements_published on public.achievements(published, achievement_date desc);

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  content text not null default '' check (char_length(content) <= 12000),
  published_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists updates_public_date on public.updates(published, published_at desc);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 2 and 160),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'unread' check (status in ('unread','read','replied','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists enquiries_date on public.enquiries(created_at desc);
create index if not exists enquiries_status_date on public.enquiries(status, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','projects','skill_groups','skills','certifications','achievements','updates','enquiries'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.skill_groups enable row level security;
alter table public.skills enable row level security;
alter table public.certifications enable row level security;
alter table public.achievements enable row level security;
alter table public.updates enable row level security;
alter table public.enquiries enable row level security;

-- Published content is the only data available to public clients.
create policy "public reads visible profile" on public.profiles for select to anon, authenticated using (is_public or (select public.is_portfolio_admin()));
create policy "admin manages profiles" on public.profiles for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "public reads published projects" on public.projects for select to anon, authenticated using (published or (select public.is_portfolio_admin()));
create policy "admin manages projects" on public.projects for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "public reads skill groups" on public.skill_groups for select to anon, authenticated using (true);
create policy "admin manages skill groups" on public.skill_groups for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "public reads skills" on public.skills for select to anon, authenticated using (true);
create policy "admin manages skills" on public.skills for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "public reads published certificates" on public.certifications for select to anon, authenticated using (published or (select public.is_portfolio_admin()));
create policy "admin manages certificates" on public.certifications for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "public reads published achievements" on public.achievements for select to anon, authenticated using (published or (select public.is_portfolio_admin()));
create policy "admin manages achievements" on public.achievements for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "public reads published updates" on public.updates for select to anon, authenticated using (published or (select public.is_portfolio_admin()));
create policy "admin manages updates" on public.updates for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
create policy "administrator manages enquiries" on public.enquiries for all to authenticated using ((select public.is_portfolio_admin())) with check ((select public.is_portfolio_admin()));
-- No anonymous enquiry read or write policy exists. The narrowly scoped
-- submission route uses the server secret only after validating all fields.

grant select on public.profiles, public.projects, public.skill_groups, public.skills, public.certifications, public.achievements, public.updates to anon, authenticated;
grant insert, update, delete on public.profiles, public.projects, public.skill_groups, public.skills, public.certifications, public.achievements, public.updates to authenticated;
grant select, insert, update, delete on public.enquiries to authenticated;
revoke all on public.enquiries from anon;

-- All buckets are private. Published portfolio media is exposed through routes
-- that confirm the corresponding record is published before signing a short URL.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('project-images','project-images',false,8388608,array['image/png','image/jpeg','image/webp']),
 ('certificate-files','certificate-files',false,8388608,array['image/png','image/jpeg','image/webp','application/pdf']),
 ('achievement-images','achievement-images',false,8388608,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "admin uploads project images" on storage.objects for insert to authenticated with check (bucket_id='project-images' and (select public.is_portfolio_admin()));
create policy "admin updates project images" on storage.objects for update to authenticated using (bucket_id='project-images' and (select public.is_portfolio_admin())) with check (bucket_id='project-images' and (select public.is_portfolio_admin()));
create policy "admin deletes project images" on storage.objects for delete to authenticated using (bucket_id='project-images' and (select public.is_portfolio_admin()));
create policy "admin manages certificate files" on storage.objects for all to authenticated using (bucket_id='certificate-files' and (select public.is_portfolio_admin())) with check (bucket_id='certificate-files' and (select public.is_portfolio_admin()));
create policy "admin uploads achievement images" on storage.objects for insert to authenticated with check (bucket_id='achievement-images' and (select public.is_portfolio_admin()));
create policy "admin updates achievement images" on storage.objects for update to authenticated using (bucket_id='achievement-images' and (select public.is_portfolio_admin())) with check (bucket_id='achievement-images' and (select public.is_portfolio_admin()));
create policy "admin deletes achievement images" on storage.objects for delete to authenticated using (bucket_id='achievement-images' and (select public.is_portfolio_admin()));

-- One-time setup after creating the administrator Auth user in the dashboard:
-- insert into public.admin_members(user_id) values ('YOUR_AUTH_USER_UUID');
