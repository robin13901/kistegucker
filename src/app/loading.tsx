export default function Loading() {
  return (
    <div className="container-default py-12">
      <div className="mb-6 h-8 w-52 animate-pulse rounded bg-zinc-200" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-white p-5 shadow-card">
            <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-200" />
            <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
