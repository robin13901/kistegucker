insert into public.members (name, role, bio, image_url, played_works)
values
  ('Anna Weber', 'Vorsitzende & Regie', 'Leitet den Verein seit 2019.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80', '[{"title":"Der zerbrochne Krug","year":2024}]'),
  ('Markus Dietz', 'Schauspiel & Technik', 'Verbindet Bühne und Lichtkonzept.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80', '[{"title":"Faust I","year":2023}]');

insert into public.events (slug, title, description, date, time, venue, cast_members, gallery, is_past)
values
  ('sommernachtstraum-2026', 'Ein Sommernachtstraum', 'Poetische Komödie unter freiem Himmel.', '2026-06-20', '19:30', 'Kulturhalle Linsengericht', '{Anna Weber,Sofia Klein}', '{https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80}', false),
  ('der-revisor-2025', 'Der Revisor', 'Satire über Macht und Korruption.', '2025-11-14', '20:00', 'Bürgersaal Altenhaßlau', '{Markus Dietz}', '{https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80}', true);
