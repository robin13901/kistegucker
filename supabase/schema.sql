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

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user'
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text,
  club_roles text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.plays (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  poster_image text,
  slug text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  play_id uuid not null references public.plays(id) on delete cascade,
  start_datetime timestamptz not null,
  end_datetime timestamptz,
  doors_datetime timestamptz,
  venue text not null default 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)',
  capacity integer not null check (capacity > 0),
  online_quota integer not null check (online_quota > 0),
  reserved_online_tickets integer not null default 0 check (reserved_online_tickets >= 0),
  gallery text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (online_quota <= capacity),
  check (reserved_online_tickets <= online_quota)
);

create table if not exists public.play_cast (
  id uuid primary key default gen_random_uuid(),
  play_id uuid not null references public.plays(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (play_id, member_id, role)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references public.performances(id) on delete cascade,
  name text not null,
  email text not null,
  tickets integer not null check (tickets between 1 and 4),
  reserved_at timestamptz not null default now(),
  other_metadata jsonb not null default '{}'::jsonb
);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

alter table public.profiles disable row level security;
alter table public.members disable row level security;
alter table public.plays disable row level security;
alter table public.performances disable row level security;
alter table public.play_cast disable row level security;
alter table public.reservations disable row level security;

insert into public.profiles (id, role)
values ('b484a9be-0edc-486b-bb02-4bf9a95dd1f4', 'admin');

create or replace function public.increment_reserved_tickets(performance_id_input uuid, ticket_amount integer)
returns boolean
language plpgsql
as $$
declare
  affected_rows integer;
begin
  update public.performances
  set reserved_online_tickets = reserved_online_tickets + ticket_amount
  where id = performance_id_input
    and ticket_amount > 0
    and reserved_online_tickets + ticket_amount <= online_quota
    and start_datetime >= now();

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

create or replace function public.decrement_reserved_tickets(performance_id_input uuid, ticket_amount integer)
returns boolean
language plpgsql
as $$
declare
  affected_rows integer;
begin
  update public.performances
  set reserved_online_tickets = greatest(reserved_online_tickets - ticket_amount, 0)
  where id = performance_id_input and ticket_amount > 0;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;
