export default function OverviewLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="app-surface rounded-2xl p-5">
        <div className="mb-3 h-3 w-28 rounded-full bg-primary/20" />
        <div className="h-8 w-64 rounded-md bg-muted" />
        <div className="mt-3 h-10 w-full max-w-xl rounded-xl bg-muted/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_20rem]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 rounded-2xl bg-muted/60" />
          <div className="h-28 rounded-2xl bg-muted/60" />
          <div className="h-28 rounded-2xl bg-muted/60" />
        </div>
        <div className="h-56 rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}

