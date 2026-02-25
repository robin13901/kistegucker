export type Member = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  played_works: Array<{ title: string; year: number }>;
};

export type Event = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  cast: string[];
  gallery: string[];
  ticket_url?: string;
  is_past: boolean;
};
