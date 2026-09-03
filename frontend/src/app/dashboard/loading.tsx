export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 py-8 sm:py-10">
      <div className="flex flex-col gap-4 border-b-[3px] border-black pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white">
        <div>
          <div className="h-5 w-24 rounded-sm border-2 border-black bg-muted dark:border-white" />
          <div className="mt-2 h-8 w-52 rounded-sm bg-muted" />
          <div className="mt-2 h-4 w-64 rounded-sm bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-md border-2 border-black bg-muted dark:border-white" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="h-24 rounded-md border-2 border-black bg-muted sm:col-span-2 dark:border-white" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-md border-2 border-black bg-muted dark:border-white" />
        ))}
      </div>

      <div className="mt-10">
        <div className="flex gap-2 rounded-md border-2 border-black p-1 dark:border-white">
          <div className="h-7 w-24 rounded-sm bg-muted" />
          <div className="h-7 w-28 rounded-sm bg-muted" />
          <div className="h-7 w-20 rounded-sm bg-muted" />
          <div className="h-7 w-24 rounded-sm bg-muted" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-40 rounded-md border-2 border-black bg-muted dark:border-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
