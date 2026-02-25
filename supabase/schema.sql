-- Supabase schema for Die Kistegucker e.V.
create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text not null,
  image_url text,
  played_works jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  date date not null,
  time time not null,
  venue text not null,
  cast text[] not null default '{}',
  gallery text[] not null default '{}',
  is_past boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  ticket_count integer not null check (ticket_count between 1 and 10),
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.reservations enable row level security;

create policy "public read events" on public.events
for select using (true);

create policy "public read members" on public.members
for select using (true);

create policy "anon insert reservations" on public.reservations
for insert with check (true);

create policy "admin full access members" on public.members
for all using ((auth.jwt() ->> 'role') = 'admin')
with check ((auth.jwt() ->> 'role') = 'admin');

create policy "admin full access events" on public.events
for all using ((auth.jwt() ->> 'role') = 'admin')
with check ((auth.jwt() ->> 'role') = 'admin');

create policy "admin read reservations" on public.reservations
for select using ((auth.jwt() ->> 'role') = 'admin');

insert into storage.buckets (id, name, public)
values ('member-images', 'member-images', true), ('event-images', 'event-images', true)
on conflict (id) do nothing;
