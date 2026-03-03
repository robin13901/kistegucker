'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type Status = { type: 'idle' | 'success' | 'error' | 'submitting'; message?: string };
type Props = { eventId: string; maxTickets?: number; disabled?: boolean };

export function ReservationForm({ eventId, maxTickets = 4, disabled = false }: Props) {
  const [status, setStatus] = useState<Status>({ type: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: 'submitting' });

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

  if (disabled) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Reservierung nicht möglich</h2>
        <p className="text-zinc-600">Diese Vorstellung ist leider ausgebucht. Bitte wähle einen anderen Termin oder kontaktiere uns direkt.</p>
        <Link href="/events" className="inline-flex font-semibold text-accent">Andere Termine ansehen →</Link>
      </div>
    );
  }

  if (status.type === 'success') {
    return (
      <div className="space-y-4 rounded-2xl bg-green-50 p-6 shadow-card">
        <h2 className="text-xl font-semibold text-green-800">Reservierung erfolgreich!</h2>
        <p className="text-green-700">{status.message}</p>
        <p className="text-sm text-green-600">Du erhältst eine Bestätigungs-E-Mail an die angegebene Adresse.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-card">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          disabled={status.type === 'submitting'}
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-zinc-100"
        />
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
          disabled={status.type === 'submitting'}
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-zinc-100"
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
          max={maxTickets}
          defaultValue={1}
          required
          disabled={status.type === 'submitting'}
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500">Maximal {maxTickets} Tickets pro Reservierung</p>
      </div>
      <p className="text-xs text-zinc-500">
        Mit Absenden akzeptierst du die Verarbeitung deiner Daten zur Ticketreservierung gemäß{' '}
        <Link href="/datenschutz" className="text-accent underline">Datenschutzerklärung</Link>.
      </p>
      <button
        type="submit"
        disabled={status.type === 'submitting'}
        className="w-full rounded-xl bg-accent px-4 py-2.5 font-semibold text-white transition hover:bg-accent/90 disabled:bg-accent/50"
      >
        {status.type === 'submitting' ? 'Wird gesendet...' : 'Reservierung absenden'}
      </button>
      {status.type === 'error' && status.message && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{status.message}</p>
      )}
    </form>
  );
}
