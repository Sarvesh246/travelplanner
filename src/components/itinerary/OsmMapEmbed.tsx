import { MapPin } from "lucide-react";

type OsmMapEmbedProps = {
  latitude: number;
  longitude: number;
  title: string;
  className?: string;
};

/**
 * OpenStreetMap embed (no extra deps). `bbox` centers on the point; `marker=lat,lon` pins it.
 * @see https://wiki.openstreetmap.org/wiki/Export
 */
export function OsmMapEmbed({ latitude, longitude, title, className = "" }: OsmMapEmbedProps) {
  const pad = 0.04;
  const left = longitude - pad;
  const bottom = latitude - pad;
  const right = longitude + pad;
  const top = latitude + pad;
  const bbox = `${left},${bottom},${right},${top}`;
  const marker = `${latitude},${longitude}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${encodeURIComponent(marker)}`;

  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
        OpenStreetMap — approximate location
      </p>
      <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-muted/30 aspect-[16/9] min-h-[200px] max-h-[min(50vh,420px)]">
        <iframe
          title={title}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground/90">
        ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>{" "}
        contributors
      </p>
    </div>
  );
}

export function StopMapPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
      No map location for this stop. Add a place when you create or edit the stop (Itinerary → Add
      stop) to see it here.
    </div>
  );
}
