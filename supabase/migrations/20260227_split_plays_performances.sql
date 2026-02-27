-- Migration: split events into plays + performances + play_cast
begin;

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
  doors_datetime timestamptz,
  venue text not null default 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)',
  capacity integer not null check (capacity > 0),
  online_quota integer not null check (online_quota > 0),
  reserved_online_tickets integer not null default 0 check (reserved_online_tickets >= 0),
  gallery text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

alter table public.reservations add column if not exists performance_id uuid references public.performances(id) on delete cascade;
alter table public.reservations add column if not exists tickets integer;
alter table public.reservations add column if not exists reserved_at timestamptz;

insert into public.plays (title, description, poster_image, slug)
select distinct on (e.slug)
  e.title,
  e.description,
  e.hero_image_url,
  e.slug
from public.events e
order by e.slug, e.event_date asc;

insert into public.performances (play_id, start_datetime, doors_datetime, venue, capacity, online_quota, reserved_online_tickets, gallery)
select
  p.id,
  (e.event_date::text || 'T' || e.performance_time::text)::timestamptz,
  (e.event_date::text || 'T' || e.admission_time::text)::timestamptz,
  e.venue,
  e.total_seats,
  e.online_seat_limit,
  e.reserved_online_tickets,
  e.gallery
from public.events e
join public.plays p on p.slug = e.slug;

update public.reservations r
set performance_id = pf.id,
    tickets = r.ticket_count,
    reserved_at = r.created_at
from public.events e
join public.performances pf on pf.start_datetime = (e.event_date::text || 'T' || e.performance_time::text)::timestamptz
join public.plays p on p.id = pf.play_id and p.slug = e.slug
where r.event_id = e.id;

insert into public.play_cast (play_id, member_id, role)
select distinct
  p.id,
  m.id,
  ce.role
from public.events e
join public.plays p on p.slug = e.slug
cross join lateral jsonb_to_recordset(e.cast_entries) as ce(member_name text, role text)
join public.members m on m.name = ce.member_name
where ce.role is not null and ce.role <> '';

commit;
