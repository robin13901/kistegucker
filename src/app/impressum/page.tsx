export default function ImpressumPage() {
  return (
        <div className="container-default py-12">
      <div className="mx-auto max-w-3xl space-y-8 rounded-2xl bg-white p-8 shadow-card">
        <h1 className="text-3xl font-bold">Impressum</h1>

        <section className="space-y-2 text-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900">Angaben gemäß § 5 TMG</h2>
          <p>Die Kistegucker e.V.</p>
          <p>Im Vorderdorf 16</p>
          <p>63589 Linsengericht</p>
        </section>

        <section className="space-y-2 text-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900">Vertreten durch den Vorstand</h2>
          <p>Ansprechpartner: Achim Geiger</p>
          <p>Mobiltelefon: 0170 9073996</p>
          <p>E-Mail: vorstand.kistegucker@gmx.de</p>
        </section>

        <section className="space-y-2 text-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900">Inhaltlich verantwortlich</h2>
          <p>Achim Geiger, Adresse wie oben.</p>
        </section>
      </div>
    </div>
  );
}
