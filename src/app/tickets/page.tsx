import { ReservationForm } from '@/components/reservation-form';

export default function TicketsPage() {
  return (
    <div className="container-default grid gap-8 py-12 md:grid-cols-[1fr_1.2fr]">
      <section>
        <h1 className="text-3xl font-bold">Ticket-Reservierung</h1>
        <p className="mt-3 text-zinc-700">
          Reserviere deine Plätze einfach online. Du erhältst eine automatische Bestätigung per
          E-Mail.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-zinc-600">
          <li>SSL-gesicherte Übertragung über Vercel</li>
          <li>Speicherung in Supabase (EU-Region empfohlen)</li>
          <li>DSGVO-konformer Umgang mit Kontaktdaten</li>
        </ul>
      </section>
      <ReservationForm />
    </div>
  );
}
