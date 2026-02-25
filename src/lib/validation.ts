import { z } from 'zod';

export const reservationSchema = z.object({
  name: z.string().min(2, 'Name ist zu kurz'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  tickets: z.coerce.number().min(1).max(10),
  eventId: z.string().min(1)
});

export type ReservationInput = z.infer<typeof reservationSchema>;
