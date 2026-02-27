-- ================================
-- HARD RESET
-- ================================
drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres;

create extension if not exists "pgcrypto";

-- ================================
-- TABLES
-- ================================

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user'
);

-- MEMBERS
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text,
  club_roles text[] not null default '{}',
  participations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  event_date date not null,
  performance_time time not null,
  admission_time time not null,
  venue text not null default 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)',
  hero_image_url text,
  cast_entries jsonb not null default '[]'::jsonb,
  gallery text[] not null default '{}',
  total_seats integer not null check (total_seats > 0),
  online_seat_limit integer not null check (online_seat_limit > 0),
  reserved_online_tickets integer not null default 0 check (reserved_online_tickets >= 0),
  is_past boolean not null default false,
  created_at timestamptz not null default now(),
  check (online_seat_limit <= total_seats),
  check (reserved_online_tickets <= online_seat_limit)
);

-- RESERVATIONS
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  ticket_count integer not null check (ticket_count between 1 and 4),
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ================================
-- GRANTS
-- ================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- ================================
-- DISABLE RLS
-- ================================
alter table public.profiles disable row level security;
alter table public.members disable row level security;
alter table public.events disable row level security;
alter table public.reservations disable row level security;

-- ================================
-- CREATE ADMIN USER
-- ================================
insert into public.profiles (id, role)
values ('b484a9be-0edc-486b-bb02-4bf9a95dd1f4', 'admin');

-- ================================
-- RESERVATION HELPERS
-- ================================
create or replace function public.increment_reserved_tickets(event_id_input uuid, ticket_amount integer)
returns boolean
language plpgsql
as $$
declare
  affected_rows integer;
begin
  update public.events
  set reserved_online_tickets = reserved_online_tickets + ticket_amount
  where id = event_id_input
    and ticket_amount > 0
    and reserved_online_tickets + ticket_amount <= online_seat_limit
    and (event_date + performance_time) >= now()
  ;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

create or replace function public.decrement_reserved_tickets(event_id_input uuid, ticket_amount integer)
returns boolean
language plpgsql
as $$
declare
  affected_rows integer;
begin
  update public.events
  set reserved_online_tickets = greatest(reserved_online_tickets - ticket_amount, 0)
  where id = event_id_input
    and ticket_amount > 0;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;
