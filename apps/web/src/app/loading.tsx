export default function Loading() {
  return (
    <div className="space-y-4 py-10">
      <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/10" />
        ))}
      </div>
    </div>
  );
}
