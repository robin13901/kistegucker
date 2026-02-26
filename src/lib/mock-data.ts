import { Event, Member } from '@/lib/types';

export const members: Member[] = [
  {
    id: '1',
    name: 'Anna Weber',
    description: 'Vorsitzende & Regie',
    bio: 'Anna führt den Verein seit 2019 und inszeniert moderne wie klassische Stücke.',
    image_url:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
    club_roles: ['Vorsitzende', 'Regie'],
    participations: [
      { piece: 'Der zerbrochne Krug', role: 'Regie' },
      { piece: 'Kabale und Liebe', role: 'Luise' }
    ]
  },
  {
    id: '2',
    name: 'Markus Dietz',
    description: 'Schauspiel & Technik',
    bio: 'Markus verbindet Schauspiel mit Licht- und Tondesign für immersive Aufführungen.',
    image_url:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    club_roles: ['Schauspieler', 'Lichttechnik'],
    participations: [
      { piece: 'Faust I', role: 'Mephisto' },
      { piece: 'Besuch der alten Dame', role: 'Lehrer' }
    ]
  },
  {
    id: '3',
    name: 'Sofia Klein',
    description: 'Schauspielerin',
    bio: 'Sofia liebt charakterstarke Rollen und leitet die Jugendtheater-AG.',
    image_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    club_roles: ['Schauspielerin', 'Jugendleitung'],
    participations: [
      { piece: 'Emilia Galotti', role: 'Emilia' },
      { piece: 'Die Physiker', role: 'Monika' }
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
    performance_time: '19:30',
    admission_time: '18:45',
    venue: 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)',
    total_seats: 280,
    online_seat_limit: 200,
    reserved_online_tickets: 126,
    hero_image_url:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
    cast: [
      { member_id: '1', member_name: 'Anna Weber', role: 'Titania' },
      { member_id: '3', member_name: 'Sofia Klein', role: 'Hermia' },
      { member_id: '2', member_name: 'Markus Dietz', role: 'Puck' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80'
    ],
    is_past: false
  },
  {
    id: 'e2',
    slug: 'der-revisor-2025',
    title: 'Der Revisor',
    description: 'Satirisches Gesellschaftsstück mit Fokus auf Korruption und Scheinheiligkeit.',
    date: '2025-11-14',
    performance_time: '20:00',
    admission_time: '19:15',
    venue: 'Bürgersaal Altenhaßlau',
    total_seats: 240,
    online_seat_limit: 160,
    reserved_online_tickets: 160,
    hero_image_url:
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
    cast: [
      { member_id: '2', member_name: 'Markus Dietz', role: 'Anton Antonowitsch' },
      { member_id: '3', member_name: 'Sofia Klein', role: 'Anna Andrejewna' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80'
    ],
    is_past: true
  }
];
