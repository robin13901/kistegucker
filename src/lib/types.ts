export type Member = {
  id: string;
  name: string;
  description: string;
  bio: string;
  image_url: string;
  club_roles: string[];
  participations: Array<{ piece: string; role: string }>;
};

export type Event = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  date: string;
  performance_time: string;
  admission_time: string;
  venue: string;
  hero_image_url?: string;
  total_seats: number;
  online_seat_limit: number;
  reserved_online_tickets: number;
  cast: Array<{
    member_id?: string;
    member_name: string;
    role: string;
  }>;
  gallery: string[];
  is_past: boolean;
};
