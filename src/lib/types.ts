export type Member = {
  id: string;
  name: string;
  description: string;
  image_url?: string | null;
  club_roles: string[];
  participations: Array<{ piece: string; role: string }>;
};

export type Performance = {
  id: string;
  start_datetime: string;
  doors_datetime?: string | null;
  venue: string;
  capacity: number;
  online_quota: number;
  reserved_online_tickets: number;
  gallery: string[];
  is_past: boolean;
};

export type Play = {
  id: string;
  slug: string;
  title: string;
  description: string;
  poster_image?: string | null;
  cast: Array<{ member_id: string; member_name: string; role: string }>;
  performances: Performance[];
};
