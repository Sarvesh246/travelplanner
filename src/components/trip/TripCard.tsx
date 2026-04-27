"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Users, MapPin, Calendar, Clock, Camera, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateRange, daysUntil, gradientForId, tripDuration } from "@/lib/utils";
import { osmStaticMapImageUrl } from "@/lib/osm/static-map-image";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ROUTES, TRIP_STATUS_OPTIONS } from "@/lib/constants";
import { uploadTripCover, updateTrip } from "@/actions/trips";
import { DeleteTripDialog } from "@/components/trip/DeleteTripDialog";

interface TripCardProps {
  trip: {
    id: string;
    name: string;
    description?: string | null;
    coverImageUrl?: string | null;
    /** ISO strings from the server; Date also supported when created client-side */
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    status: string;
  };
  memberCount: number;
  members: { id: string; name: string; avatarUrl?: string | null }[];
  stopCount: number;
  /** First itinerary stop with lat/lon — used for a default map thumbnail when there is no cover. */
  mapPreview: { lat: number; lon: number } | null;
  canEditCover: boolean;
  /** Owner/admin — status badge becomes a menu to change trip status. */
  canEditStatus: boolean;
  /** Only owners can delete — shows a trash button + confirmation dialog. */
  canDelete: boolean;
  /**
   * When true, the cover/map image is loaded with high priority (Next `priority`),
   * which satisfies the LCP hint for images above the fold on the dashboard.
   */
  coverImagePriority?: boolean;
}

function TripCardImpl({
  trip,
  memberCount,
  members,
  stopCount,
  mapPreview,
  canEditCover,
  canEditStatus,
  canDelete,
  coverImagePriority = false,
}: TripCardProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const gradient = gradientForId(trip.id);
  const days = daysUntil(trip.startDate);
  const duration = tripDuration(trip.startDate, trip.endDate);
  const overviewHref = ROUTES.tripOverview(trip.id);
  const showMap = !trip.coverImageUrl && mapPreview != null;
  const mapSrc = showMap && mapPreview ? osmStaticMapImageUrl(mapPreview.lat, mapPreview.lon) : null;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canEditCover) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await uploadTripCover(trip.id, fd);
      toast.success("Cover image saved");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNetwork =
        /NetworkError|Failed to fetch|Load failed|fetch/i.test(msg) ||
        (err instanceof TypeError && /fetch|network/i.test(msg));
      toast.error(
        isNetwork
          ? "Upload could not reach the server. Try a smaller image, check your connection, and restart the dev server after changing env. If it persists, the trip cover limit is 4MB."
          : msg
      );
    } finally {
      setUploading(false);
    }
  }

  const statusLabel =
    TRIP_STATUS_OPTIONS.find((o) => o.value === trip.status)?.label ??
    trip.status.replace(/_/g, " ");

  async function onStatusSelect(value: string) {
    if (!canEditStatus || value === trip.status) return;
    setStatusBusy(true);
    try {
      await updateTrip(trip.id, { status: value });
      toast.success("Trip status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div className="group">
      <div className="app-surface app-hover-lift rounded-2xl overflow-hidden will-change-transform motion-reduce:transform-none motion-reduce:transition-none">
        {/* Cover: link to trip + optional upload for editors */}
        <div className="h-36 relative overflow-hidden bg-muted/30">
          {trip.coverImageUrl ? (
            <Image
              src={trip.coverImageUrl}
              alt={trip.name}
              fill
              priority={coverImagePriority}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : showMap && mapSrc ? (
            <>
              <Image
                src={mapSrc}
                alt={`Map preview for ${trip.name}`}
                fill
                unoptimized
                priority={coverImagePriority}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <p className="pointer-events-none absolute bottom-1 left-2 z-[12] text-[9px] leading-tight text-white/80 drop-shadow-sm">
                © OpenStreetMap
              </p>
            </>
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-300`}
            />
          )}

          <Link
            href={overviewHref}
            prefetch
            className="absolute inset-0 z-10"
            aria-label={`Open ${trip.name}`}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/78 to-transparent" aria-hidden />

          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteOpen(true);
              }}
              className="absolute top-2 left-2 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background/90 text-destructive shadow backdrop-blur-sm opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
              title="Delete trip…"
              aria-label={`Delete ${trip.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {canEditCover && (
            <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onFileChange}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
                disabled={uploading}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/90 text-foreground shadow border border-border/80 backdrop-blur-sm hover:bg-background disabled:opacity-50"
                title="Upload cover image"
                aria-label="Upload cover image"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>
          )}

          {canEditStatus ? (
            <div
              className="absolute top-3 right-3 z-20"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    disabled={statusBusy}
                    className="text-xs font-medium pl-2 pr-1.5 py-1 rounded-full bg-black/30 text-white backdrop-blur-sm border border-white/10 inline-flex items-center gap-0.5 hover:bg-black/45 transition-colors disabled:opacity-60"
                    title="Change trip status"
                    aria-label="Change trip status"
                  >
                    {statusLabel}
                    {statusBusy ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    )}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-[60] min-w-[10.5rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-foreground text-xs shadow-md"
                    sideOffset={4}
                    align="end"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {TRIP_STATUS_OPTIONS.map((opt) => (
                      <DropdownMenu.Item
                        key={opt.value}
                        className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        onSelect={() => onStatusSelect(opt.value)}
                        disabled={opt.value === trip.status}
                      >
                        {opt.label}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          ) : (
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/30 text-white backdrop-blur-sm">
                {statusLabel}
              </span>
            </div>
          )}
        </div>

        {canDelete && (
          <DeleteTripDialog
            tripId={trip.id}
            tripName={trip.name}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        )}

        <Link href={overviewHref} prefetch className="block min-w-0 p-4">
          <h3 className="mb-1 truncate text-base font-semibold leading-tight">{trip.name}</h3>

          <div className="mb-3 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 break-words">{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {stopCount > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {stopCount} stop{stopCount !== 1 ? "s" : ""}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {duration}d
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {memberCount}
              </span>
            </div>
            <div className="shrink-0">
              <AvatarGroup users={members} maxVisible={3} size="xs" />
            </div>
          </div>

          {days !== null && days >= 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="flex items-center gap-2 text-xs font-medium text-primary">
                <span className="app-waypoint h-1.5 w-1.5" aria-hidden />
                {days === 0 ? "Trip starts today! 🎉" : `${days} day${days !== 1 ? "s" : ""} to go`}
              </p>
            </div>
          )}
          {days !== null && days < 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

export const TripCard = memo(TripCardImpl);
TripCard.displayName = "TripCard";
