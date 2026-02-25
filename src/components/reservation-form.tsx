'use client';

import { FormEvent, useState } from 'react';

type Status = { type: 'idle' | 'success' | 'error'; message?: string };

export function ReservationForm({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      tickets: Number(formData.get('tickets') ?? 1),
      eventId
    };

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setStatus({
        type: 'success',
        message: 'Danke! Deine Reservierung wurde gespeichert und bestätigt.'
      });
      event.currentTarget.reset();
      return;
    }

    const result = (await response.json()) as { error?: string };
    setStatus({ type: 'error', message: result.error ?? 'Reservierung fehlgeschlagen' });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input id="name" name="name" required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="tickets" className="mb-1 block text-sm font-medium">
          Anzahl Tickets
        </label>
        <input
          id="tickets"
          name="tickets"
          type="number"
          min={1}
          max={10}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <p className="text-xs text-zinc-500">
        Mit Absenden akzeptierst du die Verarbeitung deiner Daten zur Ticketreservierung gemäß
        Datenschutzerklärung.
      </p>
      <button type="submit" className="rounded-xl bg-accent px-4 py-2 font-semibold text-white">
        Reservierung absenden
      </button>
      {status.message && (
        <p className={status.type === 'success' ? 'text-green-700' : 'text-red-700'}>{status.message}</p>
      )}
    </form>
  );
}
