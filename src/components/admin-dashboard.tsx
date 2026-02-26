'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AdminState = {
  email: string;
  password: string;
  loggedIn: boolean;
  feedback?: string;
};

export function AdminDashboard() {
  const [state, setState] = useState<AdminState>({ email: '', password: '', loggedIn: false });
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabase = useMemo(() => (hasSupabaseConfig ? createClientComponentClient() : null), [hasSupabaseConfig]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setState((prev) => ({ ...prev, feedback: 'Supabase ist nicht konfiguriert.' }));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password
    });

    if (error) {
      setState((prev) => ({ ...prev, feedback: error.message }));
      return;
    }

    setState((prev) => ({ ...prev, loggedIn: true, feedback: 'Login erfolgreich.' }));
  }

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const response = await fetch('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify({
        title: formData.get('title'),
        slug: formData.get('slug'),
        description: formData.get('description'),
        date: formData.get('date'),
        time: formData.get('time'),
        venue: formData.get('venue')
      })
    });

    setState((prev) => ({
      ...prev,
      feedback: response.ok ? 'Aufführung erstellt.' : 'Aufführung konnte nicht erstellt werden.'
    }));
  }

  if (!state.loggedIn) {
    return (
      <form onSubmit={signIn} className="max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Admin Login</h2>
        <input
          type="email"
          placeholder="admin@kistegucker.de"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={state.email}
          onChange={(event) => setState((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          type="password"
          placeholder="Passwort"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={state.password}
          onChange={(event) => setState((prev) => ({ ...prev, password: event.target.value }))}
        />
        <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white">Einloggen</button>
        {state.feedback && <p className="text-sm text-zinc-600">{state.feedback}</p>}
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Aufführungen erstellen</h2>
        <form onSubmit={createEvent} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="title" required placeholder="Titel" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="slug" required placeholder="slug" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="date" required type="date" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="time" required type="time" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="venue" required placeholder="Ort" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <textarea name="description" required placeholder="Beschreibung" className="rounded-lg border border-zinc-300 px-3 py-2 md:col-span-2" />
          <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white md:col-span-2">Speichern</button>
        </form>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-xl font-semibold">Verwaltung</h2>
        <p className="text-sm text-zinc-600">
          Über die geschützten API-Routen können Admins Mitglieder bearbeiten, Bilder hochladen und
          Reservierungen einsehen.
        </p>
      </section>
      {state.feedback && <p className="text-sm text-zinc-700">{state.feedback}</p>}
    </div>
  );
}
