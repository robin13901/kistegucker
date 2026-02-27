export default function DatenschutzPage() {
  return (
    <div className="container-default py-12">
      <div className="mx-auto max-w-3xl space-y-8 rounded-2xl bg-white p-8 shadow-card">
        <h1 className="break-words text-2xl font-bold sm:text-3xl">Datenschutzerklärung</h1>
        <p className="text-zinc-700">
          Diese Website verarbeitet personenbezogene Daten ausschließlich im notwendigen Umfang und
          gemäß DSGVO.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Hosting</h2>
          <p className="text-zinc-700">
            Hosting erfolgt über Vercel. Dabei werden technische Zugriffsdaten in Server-Logs
            verarbeitet.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Ticketreservierung</h2>
          <p className="text-zinc-700">
            Bei Reservierungen speichern wir Name, E-Mail-Adresse und Ticketanzahl. Die Daten dienen
            ausschließlich zur Abwicklung der Reservierung und zur Bestätigungs-E-Mail.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Auftragsverarbeitung</h2>
          <p className="text-zinc-700">
            Für Datenbank, Authentifizierung und Dateispeicherung nutzen wir Supabase als
            Auftragsverarbeiter.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Cookies</h2>
          <p className="text-zinc-700">
            Es werden nur technisch notwendige Cookies eingesetzt. Tracking-Cookies verwenden wir
            aktuell nicht.
          </p>
        </section>
      </div>
    </div>
  );
}
