'use client';

import { ChangeEvent, FormEvent, InputHTMLAttributes, TextareaHTMLAttributes, useMemo, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AdminState = {
  email: string;
  password: string;
  loggedIn: boolean;
  feedback?: string;
};

type CastEntry = { member_name: string; role: string };
type Participation = { piece: string; role: string };

type EventForm = {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  performance_time: string;
  admission_time: string;
  total_seats: number;
  online_seat_limit: number;
  venue: string;
  hero_image_url: string;
  cast_entries: CastEntry[];
  is_past: boolean;
};

type MemberForm = {
  id?: string;
  name: string;
  description: string;
  bio: string;
  image_url: string;
  club_roles: string[];
  participations: Participation[];
};

const DEFAULT_VENUE = 'Bürgersaal Eidengesäß (Talstraße 4A, 63589 Linsengericht)';

const initialEvent: EventForm = {
  title: '',
  description: '',
  event_date: '',
  performance_time: '',
  admission_time: '',
  total_seats: 250,
  online_seat_limit: 200,
  venue: DEFAULT_VENUE,
  hero_image_url: '',
  cast_entries: [{ member_name: '', role: '' }],
  is_past: false
};

const initialMember: MemberForm = {
  name: '',
  description: '',
  bio: '',
  image_url: '',
  club_roles: [''],
  participations: [{ piece: '', role: '' }]
};

function FieldInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, id, hint, className = '', ...rest } = props;
  return (
    <label htmlFor={id} className="flex min-h-[84px] flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        id={id}
        {...rest}
        className={`w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
      />
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const { label, id, hint, className = '', onInput, ...rest } = props;
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <textarea
        id={id}
        {...rest}
        onInput={(event) => {
          const target = event.currentTarget;
          target.style.height = 'auto';
          target.style.height = `${target.scrollHeight}px`;
          onInput?.(event);
        }}
        className={`w-full resize-none overflow-hidden rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
      />
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function AdminDashboard() {
  const [state, setState] = useState<AdminState>({ email: '', password: '', loggedIn: false });
  const [activeTab, setActiveTab] = useState<'events' | 'members' | 'reservations'>('events');
  const [eventForm, setEventForm] = useState<EventForm>(initialEvent);
  const [memberForm, setMemberForm] = useState<MemberForm>(initialMember);
  const [events, setEvents] = useState<EventForm[]>([]);
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [reservations, setReservations] = useState<Array<Record<string, unknown>>>([]);
  const [selectedReservationEventId, setSelectedReservationEventId] = useState<string>('');
  const eventImageInputRef = useRef<HTMLInputElement | null>(null);
  const memberImageInputRef = useRef<HTMLInputElement | null>(null);
  const hasSupabaseConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabase = useMemo(() => (hasSupabaseConfig ? createClientComponentClient() : null), [hasSupabaseConfig]);

  async function loadData() {
    const [eventResponse, memberResponse, reservationResponse] = await Promise.all([
      fetch('/api/admin/events'),
      fetch('/api/admin/members'),
      fetch('/api/admin/reservations')
    ]);

    if (eventResponse.ok) {
      const result = await eventResponse.json();
      setEvents(result.data ?? []);
    }

    if (memberResponse.ok) {
      const result = await memberResponse.json();
      setMembers(result.data ?? []);
    }

    if (reservationResponse.ok) {
      const result = await reservationResponse.json();
      setReservations(result.data ?? []);
    }
  }

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

    await loadData();
    setState((prev) => ({ ...prev, loggedIn: true, feedback: undefined }));
  }

  async function uploadImage(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Upload fehlgeschlagen'));
      reader.readAsDataURL(file);
    });
  }

  async function onImageSelect(event: ChangeEvent<HTMLInputElement>, type: 'event' | 'member') {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const url = await uploadImage(file);
      if (type === 'event') {
        setEventForm((prev) => ({ ...prev, hero_image_url: url }));
      } else {
        setMemberForm((prev) => ({ ...prev, image_url: url }));
      }
    } catch {
      setState((prev) => ({ ...prev, feedback: 'Bild konnte nicht hochgeladen werden.' }));
    }
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const endpoint = '/api/admin/events';
    const method = eventForm.id ? 'PUT' : 'POST';
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventForm)
    });

    setState((prev) => ({
      ...prev,
      feedback: response.ok ? 'Aufführung gespeichert.' : 'Aufführung konnte nicht gespeichert werden.'
    }));

    if (response.ok) {
      setEventForm(initialEvent);
      await loadData();
    }
  }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const endpoint = '/api/admin/members';
    const method = memberForm.id ? 'PUT' : 'POST';
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberForm)
    });

    setState((prev) => ({
      ...prev,
      feedback: response.ok ? 'Mitglied gespeichert.' : 'Mitglied konnte nicht gespeichert werden.'
    }));

    if (response.ok) {
      setMemberForm(initialMember);
      await loadData();
    }
  }

  async function deleteReservation(id: string) {
    const response = await fetch(`/api/admin/reservations?id=${id}`, { method: 'DELETE' });
    setState((prev) => ({ ...prev, feedback: response.ok ? 'Reservierung gelöscht.' : 'Reservierung konnte nicht gelöscht werden.' }));
    if (response.ok) {
      await loadData();
    }
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

  const filteredReservations = selectedReservationEventId
    ? reservations.filter((entry) => (entry.event as { id?: string })?.id === selectedReservationEventId)
    : reservations;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveTab('events')} className="rounded-xl border px-4 py-2">Aufführungen</button>
        <button onClick={() => setActiveTab('members')} className="rounded-xl border px-4 py-2">Mitglieder</button>
        <button onClick={() => setActiveTab('reservations')} className="rounded-xl border px-4 py-2">Reservierungen</button>
      </div>

      {activeTab === 'events' && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold">Aufführungen verwalten</h2>
          <form onSubmit={saveEvent} className="mt-4 grid gap-3 md:grid-cols-2">
            <FieldInput id="event-title" label="Titel des Theaterstücks" value={eventForm.title} onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))} required hint="Kann bei mehreren Aufführungen wiederverwendet werden." />
            <FieldInput id="event-venue" label="Ort" value={eventForm.venue} onChange={(event) => setEventForm((prev) => ({ ...prev, venue: event.target.value }))} required />
            <FieldInput id="event-date" type="date" label="Aufführungsdatum" value={eventForm.event_date} onChange={(event) => setEventForm((prev) => ({ ...prev, event_date: event.target.value }))} required className="[&::-webkit-date-and-time-value]:text-left" />
            <FieldInput id="event-performance-time" type="time" label="Aufführungszeit" value={eventForm.performance_time} onChange={(event) => setEventForm((prev) => ({ ...prev, performance_time: event.target.value }))} required className="[&::-webkit-date-and-time-value]:text-left" />
            <FieldInput id="event-admission-time" type="time" label="Einlassbeginn" value={eventForm.admission_time} onChange={(event) => setEventForm((prev) => ({ ...prev, admission_time: event.target.value }))} required className="[&::-webkit-date-and-time-value]:text-left" />
            <FieldInput id="event-total-seats" type="number" min={1} label="Gesamtanzahl Plätze" value={eventForm.total_seats} onChange={(event) => setEventForm((prev) => ({ ...prev, total_seats: Number(event.target.value) }))} required />
            <FieldInput id="event-online-seats" type="number" min={1} max={eventForm.total_seats} label="Anzahl Online-Reservierungen" value={eventForm.online_seat_limit} onChange={(event) => setEventForm((prev) => ({ ...prev, online_seat_limit: Number(event.target.value) }))} required />
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Titelbild hochladen</label>
              <input ref={eventImageInputRef} type="file" accept="image/*" onChange={(event) => onImageSelect(event, 'event')} className="hidden" />
              <button type="button" onClick={() => eventImageInputRef.current?.click()} className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                Bild auswählen
              </button>
              {eventForm.hero_image_url && <img src={eventForm.hero_image_url} alt="Titelbild Vorschau" className="mt-2 h-40 w-full rounded-xl border border-zinc-200 object-cover" />}
            </div>
            <AutoTextarea id="event-description" label="Beschreibung" value={eventForm.description} onChange={(event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))} required className="md:col-span-2 min-h-[120px]" />
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium">Besetzung (Rollenname + Mitglied)</p>
              {eventForm.cast_entries.map((entry, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-2">
                  <FieldInput label="Rollenname" value={entry.role} onChange={(event) => setEventForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row) }))} />
                  <label className="flex min-h-[84px] flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-700">Mitglied</span>
                    <select className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={entry.member_name} onChange={(event) => setEventForm((prev) => ({ ...prev, cast_entries: prev.cast_entries.map((row, rowIndex) => rowIndex === index ? { ...row, member_name: event.target.value } : row) }))}>
                      <option value="">Mitglied auswählen</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
              <button type="button" onClick={() => setEventForm((prev) => ({ ...prev, cast_entries: [...prev.cast_entries, { role: '', member_name: '' }] }))} className="rounded-lg border px-3 py-2 text-sm">Besetzungszeile hinzufügen</button>
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" checked={eventForm.is_past} onChange={(event) => setEventForm((prev) => ({ ...prev, is_past: event.target.checked }))} />
              Bereits vergangene Aufführung
            </label>
            <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white md:col-span-2">Speichern</button>
          </form>

          <div className="mt-6 space-y-2">
            {events.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <span>{entry.title}</span>
                <div className="flex gap-2">
                  <button onClick={() => setEventForm(entry)} className="rounded-lg border px-3 py-1 text-sm">Bearbeiten</button>
                  <button onClick={async () => { await fetch(`/api/admin/events?id=${entry.id}`, { method: 'DELETE' }); await loadData(); }} className="rounded-lg border px-3 py-1 text-sm text-red-700">Löschen</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'members' && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold">Mitglieder verwalten</h2>
          <form onSubmit={saveMember} className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Foto hochladen</label>
              <input ref={memberImageInputRef} type="file" accept="image/*" onChange={(event) => onImageSelect(event, 'member')} className="hidden" />
              <button type="button" onClick={() => memberImageInputRef.current?.click()} className="w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                Bild auswählen
              </button>
              {memberForm.image_url && <img src={memberForm.image_url} alt="Mitglied Vorschau" className="mt-2 h-40 w-full rounded-xl border border-zinc-200 object-cover" />}
            </div>
            <FieldInput id="member-name" label="Name" value={memberForm.name} onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))} required />
            <AutoTextarea id="member-bio" label="Beschreibung / Bio" value={memberForm.bio} onChange={(event) => setMemberForm((prev) => ({ ...prev, bio: event.target.value, description: event.target.value }))} required className="md:col-span-2 min-h-[100px]" />
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium">Rollen im Verein</p>
              {memberForm.club_roles.map((role, index) => (
                <FieldInput key={index} label="Vereinsrolle" value={role} onChange={(event) => setMemberForm((prev) => ({ ...prev, club_roles: prev.club_roles.map((entry, entryIndex) => entryIndex === index ? event.target.value : entry) }))} />              ))}
              <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setMemberForm((prev) => ({ ...prev, club_roles: [...prev.club_roles, ''] }))}>Rolle hinzufügen</button>
            </div>
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium">Mitgespielte Stücke (Stück + Rolle)</p>
              {memberForm.participations.map((entry, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-2">
                  <FieldInput label="Stück" value={entry.piece} onChange={(event) => setMemberForm((prev) => ({ ...prev, participations: prev.participations.map((row, rowIndex) => rowIndex === index ? { ...row, piece: event.target.value } : row) }))} />
                  <FieldInput label="Rolle im Stück" value={entry.role} onChange={(event) => setMemberForm((prev) => ({ ...prev, participations: prev.participations.map((row, rowIndex) => rowIndex === index ? { ...row, role: event.target.value } : row) }))} />
                </div>
              ))}
              <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setMemberForm((prev) => ({ ...prev, participations: [...prev.participations, { piece: '', role: '' }] }))}>Eintrag hinzufügen</button>
            </div>
            <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-white md:col-span-2">Speichern</button>
          </form>

          <div className="mt-6 space-y-2">
            {members.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <span>{entry.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => setMemberForm(entry)} className="rounded-lg border px-3 py-1 text-sm">Bearbeiten</button>
                  <button onClick={async () => { await fetch(`/api/admin/members?id=${entry.id}`, { method: 'DELETE' }); await loadData(); }} className="rounded-lg border px-3 py-1 text-sm text-red-700">Löschen</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'reservations' && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold">Reservierungen je Aufführung</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <select className="rounded-lg border border-zinc-300 px-3 py-2" value={selectedReservationEventId} onChange={(event) => setSelectedReservationEventId(event.target.value)}>
              <option value="">Alle Aufführungen</option>
              {events.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.title}</option>
              ))}
            </select>
            <a href={`/api/admin/reservations?format=csv${selectedReservationEventId ? `&event_id=${selectedReservationEventId}` : ''}`} className="rounded-lg border px-3 py-2 text-sm">Export CSV</a>
            <a href={`/api/admin/reservations?format=xls${selectedReservationEventId ? `&event_id=${selectedReservationEventId}` : ''}`} className="rounded-lg border px-3 py-2 text-sm">Export Excel</a>
          </div>

          <div className="mt-4 space-y-2">
            {filteredReservations.map((entry) => (
              <div key={String(entry.id)} className="flex flex-wrap items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <div>
                  <p className="font-medium">{String(entry.name)} ({String(entry.ticket_count)} Tickets)</p>
                  <p className="text-xs text-zinc-500">{String((entry.event as { title?: string })?.title ?? '')} · {String(entry.email)}</p>
                </div>
                <button onClick={() => deleteReservation(String(entry.id))} className="rounded-lg border px-3 py-1 text-sm text-red-700">Löschen</button>
              </div>
            ))}
          </div>
        </section>
      )}
      {state.feedback && <p className="text-sm text-zinc-700">{state.feedback}</p>}
    </div>
  );
}
