export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 py-12">
      <div className="h-8 w-56 rounded-lg bg-muted" />
      <div className="mt-12 flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
