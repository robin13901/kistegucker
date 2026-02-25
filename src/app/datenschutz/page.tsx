export default function DatenschutzPage() {
  return (
    <div className="container-default prose prose-zinc py-12">
      <h1>Datenschutzerklärung</h1>
      <p>
        Diese Website verarbeitet personenbezogene Daten ausschließlich im notwendigen Umfang und
        gemäß DSGVO.
      </p>
      <h2>Hosting</h2>
      <p>
        Hosting erfolgt über Vercel. Dabei werden technische Zugriffsdaten in Server-Logs
        verarbeitet.
      </p>
      <h2>Ticketreservierung</h2>
      <p>
        Bei Reservierungen speichern wir Name, E-Mail-Adresse, Ticketanzahl und Eventbezug. Die
        Daten dienen ausschließlich zur Abwicklung der Reservierung und Bestätigungs-E-Mail.
      </p>
      <h2>Auftragsverarbeitung durch Supabase</h2>
      <p>
        Für Datenbank, Authentifizierung und Dateispeicherung nutzen wir Supabase als
        Auftragsverarbeiter.
      </p>
      <h2>SSL-/TLS-Verschlüsselung</h2>
      <p>Die Website nutzt HTTPS-Verschlüsselung (SSL/TLS) für eine sichere Übertragung.</p>
      <h2>Cookies</h2>
      <p>
        Es werden nur technisch notwendige Cookies eingesetzt. Tracking-Cookies werden aktuell nicht
        verwendet.
      </p>
    </div>
  );
}
