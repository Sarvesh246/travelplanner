export default function TripSectionLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden>
      <div className="app-surface rounded-2xl p-5">
        <div className="mb-3 h-3 w-32 rounded-full bg-primary/20" />
        <div className="h-7 w-52 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-lg rounded bg-muted" />
      </div>
      <div className="h-40 rounded-2xl border border-border/70 bg-muted/50" />
    </div>
  );
}
