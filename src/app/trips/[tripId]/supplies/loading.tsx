export default function SuppliesLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="app-surface rounded-2xl p-5">
        <div className="mb-2 h-3 w-24 rounded-full bg-primary/20" />
        <div className="h-7 w-40 rounded-md bg-muted" />
      </div>
      <div className="h-14 rounded-2xl bg-muted/60" />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          <div className="h-20 rounded-2xl bg-muted/60" />
          <div className="h-20 rounded-2xl bg-muted/60" />
          <div className="h-20 rounded-2xl bg-muted/60" />
        </div>
        <div className="hidden h-80 rounded-2xl bg-muted/60 lg:block" />
      </div>
    </div>
  );
}

