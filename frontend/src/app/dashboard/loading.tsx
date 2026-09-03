export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-3 w-16 rounded-lg bg-muted" />
          <div className="mt-2 h-8 w-52 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-64 rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="h-24 rounded-xl bg-muted sm:col-span-2" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>

      <div className="mt-10">
        <div className="flex gap-4 border-b pb-3">
          <div className="h-5 w-24 rounded-lg bg-muted" />
          <div className="h-5 w-28 rounded-lg bg-muted" />
          <div className="h-5 w-20 rounded-lg bg-muted" />
          <div className="h-5 w-24 rounded-lg bg-muted" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
