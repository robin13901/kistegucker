insert into public.members (name, description, bio, image_url, club_roles, participations)
values
  (
    'Anna Weber',
    'Vorsitzende & Regie',
    'Leitet den Verein seit 2019.',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    '{Vorsitzende,Regie}',
    '[{"piece":"Der zerbrochne Krug","role":"Regie"}]'
  ),
  (
    'Markus Dietz',
    'Schauspiel & Technik',
    'Verbindet Bühne und Lichtkonzept.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    '{Schauspieler,Lichttechnik}',
    '[{"piece":"Faust I","role":"Mephisto"}]'
  );

insert into public.events (
  slug,
  title,
  description,
  event_date,
  performance_time,
  admission_time,
  venue,
  hero_image_url,
  cast_entries,
  gallery,
  total_seats,
  online_seat_limit,
  reserved_online_tickets,
  is_past
)
values
  (
    'sommernachtstraum-2026',
    'Ein Sommernachtstraum',
    'Poetische Komödie unter freiem Himmel.',
    '2026-06-20',
    '19:30',
    '18:45',
    'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
    '[{"member_name":"Anna Weber","role":"Titania"},{"member_name":"Sofia Klein","role":"Hermia"}]',
    '{https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80}',
    280,
    200,
    126,
    false
  ),
  (
    'der-revisor-2025',
    'Der Revisor',
    'Satire über Macht und Korruption.',
    '2025-11-14',
    '20:00',
    '19:15',
    'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
    '[{"member_name":"Markus Dietz","role":"Anton Antonowitsch"}]',
    '{https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80}',
    240,
    160,
    160,
    true
  );