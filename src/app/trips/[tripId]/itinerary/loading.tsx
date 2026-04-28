export default function ItineraryLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="app-surface rounded-2xl p-5">
        <div className="mb-2 h-3 w-24 rounded-full bg-primary/20" />
        <div className="h-7 w-40 rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <div className="h-24 rounded-2xl bg-muted/60" />
          <div className="h-24 rounded-2xl bg-muted/60" />
          <div className="h-24 rounded-2xl bg-muted/60" />
        </div>
        <div className="hidden h-[28rem] rounded-2xl bg-muted/60 md:block" />
      </div>
    </div>
  );
}

