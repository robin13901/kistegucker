'use client';

import { useEffect, useState } from 'react';

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('kistegucker-cookie-consent');
    setOpen(!accepted);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[95%] max-w-3xl -translate-x-1/2 rounded-2xl bg-zinc-900 p-4 text-sm text-white shadow-card">
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies. Tracking- oder Marketing-Cookies
        setzen wir derzeit nicht ein.
      </p>
      <button
        type="button"
        className="mt-3 rounded-lg bg-accent px-3 py-1.5 font-medium"
        onClick={() => {
          localStorage.setItem('kistegucker-cookie-consent', 'accepted');
          setOpen(false);
        }}
      >
        Verstanden
      </button>
    </div>
  );
}
