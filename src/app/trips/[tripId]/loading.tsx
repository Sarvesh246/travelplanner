export default function TripSectionLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className="h-7 w-40 rounded-md bg-muted" />
      <div className="h-4 w-full max-w-lg rounded bg-muted" />
      <div className="h-4 w-2/3 max-w-md rounded bg-muted" />
      <div className="h-40 rounded-2xl bg-muted/60" />
    </div>
  );
}
