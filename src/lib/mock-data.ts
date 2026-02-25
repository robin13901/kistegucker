import { Event, Member } from '@/lib/types';

export const members: Member[] = [
  {
    id: '1',
    name: 'Anna Weber',
    role: 'Vorsitzende & Regie',
    bio: 'Anna führt den Verein seit 2019 und inszeniert moderne wie klassische Stücke.',
    image_url:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    played_works: [
      { title: 'Der zerbrochne Krug', year: 2024 },
      { title: 'Kabale und Liebe', year: 2022 }
    ]
  },
  {
    id: '2',
    name: 'Markus Dietz',
    role: 'Schauspiel & Technik',
    bio: 'Markus verbindet Schauspiel mit Licht- und Tondesign für immersive Aufführungen.',
    image_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    played_works: [
      { title: 'Faust I', year: 2023 },
      { title: 'Besuch der alten Dame', year: 2021 }
    ]
  },
  {
    id: '3',
    name: 'Sofia Klein',
    role: 'Schauspielerin',
    bio: 'Sofia liebt charakterstarke Rollen und leitet die Jugendtheater-AG.',
    image_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    played_works: [
      { title: 'Emilia Galotti', year: 2024 },
      { title: 'Die Physiker', year: 2020 }
    ]
  }
];

export const events: Event[] = [
  {
    id: 'e1',
    slug: 'sommernachtstraum-2026',
    title: 'Ein Sommernachtstraum',
    description:
      'Eine poetische Komödie unter freiem Himmel mit Live-Musik und neuem Bühnenbild.',
    date: '2026-06-20',
    time: '19:30',
    venue: 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)',
    cast: [
      { member_id: '1', actor: 'Anna Weber', role: 'Titania' },
      { member_id: '3', actor: 'Sofia Klein', role: 'Hermia' },
      { member_id: '2', actor: 'Markus Dietz', role: 'Puck' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80'
    ],
    ticket_url: '/tickets',
    is_past: false
  },
  {
    id: 'e2',
    slug: 'der-revisor-2025',
    title: 'Der Revisor',
    description: 'Satirisches Gesellschaftsstück mit Fokus auf Korruption und Scheinheiligkeit.',
    date: '2025-11-14',
    time: '20:00',
    venue: 'Bürgersaal Altenhaßlau',
    cast: [
      { member_id: '2', actor: 'Markus Dietz', role: 'Anton Antonowitsch' },
      { member_id: '3', actor: 'Sofia Klein', role: 'Anna Andrejewna' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80'
    ],
    ticket_url: '/tickets',
    is_past: true
  }
];
