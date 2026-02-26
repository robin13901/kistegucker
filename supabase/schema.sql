-- Supabase schema for Die Kistegucker e.V.
create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  bio text not null,
  image_url text,
  club_roles text[] not null default '{}',
  participations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

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

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  ticket_count integer not null check (ticket_count between 1 and 4),
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.reservations enable row level security;

-- Policies
create policy "public read events" on public.events
for select using (true);

create policy "public read members" on public.members
for select using (true);

create policy "anon insert reservations" on public.reservations
for insert with check (true);

create policy "admin full access members" on public.members
for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin full access events" on public.events
for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin full access reservations" on public.reservations
for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


create or replace function public.increment_reserved_tickets(event_id_input uuid, ticket_amount integer)
returns boolean
language plpgsql
security definer
as $$
begin
  update public.events
  set reserved_online_tickets = reserved_online_tickets + ticket_amount
  where id = event_id_input
    and reserved_online_tickets + ticket_amount <= online_seat_limit;

  return found;
end;
$$;

create or replace function public.decrement_reserved_tickets(event_id_input uuid, ticket_amount integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.events
  set reserved_online_tickets = greatest(reserved_online_tickets - ticket_amount, 0)
  where id = event_id_input;
end;
$$;