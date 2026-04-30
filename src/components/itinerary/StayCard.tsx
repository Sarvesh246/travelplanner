"use client";

import { useState } from "react";
import {
  Bed,
  CheckCircle2,
  CircleDashed,
  Ban,
  Edit3,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatDateRange, formatTimeValue } from "@/lib/utils";
import { STAY_STATUS_COLORS } from "@/lib/constants";
import { deleteStay, updateStay } from "@/actions/itinerary";
import { toast } from "sonner";
import { StayStatus } from "@prisma/client";
import type { StaySerialized } from "./types";

interface StayCardProps {
  stay: StaySerialized;
  canEdit: boolean;
}

const STATUS_ICONS: Record<StayStatus, React.ReactNode> = {
  OPTION: <CircleDashed className="w-3 h-3" />,
  BOOKED: <CheckCircle2 className="w-3 h-3" />,
  CANCELLED: <Ban className="w-3 h-3" />,
};

export function StayCard({ stay, canEdit }: StayCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StayStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(stay.name);
  const [address, setAddress] = useState(stay.address ?? "");
  const [roomSiteInput, setRoomSiteInput] = useState("");
  const [roomSiteNumbers, setRoomSiteNumbers] = useState(stay.roomSiteNumbers);
  const [arrivalTime, setArrivalTime] = useState(stay.arrivalTime ?? "");
  const [checkIn, setCheckIn] = useState(stay.checkIn?.slice(0, 10) ?? "");
  const [checkInTime, setCheckInTime] = useState(stay.checkInTime ?? "");
  const [checkOut, setCheckOut] = useState(stay.checkOut?.slice(0, 10) ?? "");
  const [checkOutTime, setCheckOutTime] = useState(stay.checkOutTime ?? "");
  const [leaveTime, setLeaveTime] = useState(stay.leaveTime ?? "");
  const [totalPrice, setTotalPrice] = useState(
    stay.totalPrice != null ? stay.totalPrice.toString() : ""
  );
  const [url, setUrl] = useState(stay.url ?? "");

  async function setStatus(status: StayStatus) {
    setMenuOpen(false);
    setPendingStatus(status);
    try {
      await updateStay(stay.id, { status });
      toast.success(`Marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this stay. Please try again.");
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    try {
      await deleteStay(stay.id);
      toast.success("Stay removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this stay. Please try again.");
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateStay(stay.id, {
        name: name.trim(),
        address,
        roomSiteNumbers,
        arrivalTime,
        checkIn,
        checkInTime,
        checkOut,
        checkOutTime,
        leaveTime,
        totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
        url,
      });
      setEditing(false);
      toast.success("Stay updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this stay. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function addRoomSiteNumber() {
    const next = roomSiteInput.trim();
    if (!next || roomSiteNumbers.includes(next)) return;
    setRoomSiteNumbers((current) => [...current, next]);
    setRoomSiteInput("");
  }

  function removeRoomSiteNumber(value: string) {
    setRoomSiteNumbers((current) => current.filter((item) => item !== value));
  }

  const arrivalLabel = formatTimeValue(stay.arrivalTime);
  const checkInLabel = formatTimeValue(stay.checkInTime);
  const checkOutLabel = formatTimeValue(stay.checkOutTime);
  const leaveLabel = formatTimeValue(stay.leaveTime);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Bed className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm truncate">{stay.name}</h4>
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", STAY_STATUS_COLORS[stay.status])}>
              {pendingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : STATUS_ICONS[stay.status]}
              {stay.status}
            </span>
          </div>
          {stay.address && <p className="text-xs text-muted-foreground mt-0.5 truncate">{stay.address}</p>}
          {stay.roomSiteNumbers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stay.roomSiteNumbers.map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {value}
                </span>
              ))}
            </div>
          )}
          {(stay.checkIn || stay.checkOut) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDateRange(stay.checkIn, stay.checkOut)}
            </p>
          )}
          {(arrivalLabel || checkInLabel || checkOutLabel || leaveLabel) && (
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {(arrivalLabel || checkInLabel) && (
                <p>
                  {arrivalLabel ? `Arrive ${arrivalLabel}` : "Arrival TBD"}
                  {checkInLabel ? ` • Check-in ${checkInLabel}` : ""}
                </p>
              )}
              {(checkOutLabel || leaveLabel) && (
                <p>
                  {checkOutLabel ? `Check-out ${checkOutLabel}` : "Check-out TBD"}
                  {leaveLabel ? ` • Leave ${leaveLabel}` : ""}
                </p>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
            {stay.totalPrice !== null && <span className="font-medium">{formatCurrency(stay.totalPrice)} total</span>}
            {stay.pricePerNight !== null && <span className="text-muted-foreground">{formatCurrency(stay.pricePerNight)}/night</span>}
            {stay.url && (
              <a
                href={stay.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Link <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Stay options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditing((prev) => !prev);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> {editing ? "Close editor" : "Edit details"}
                </button>
                {stay.status !== "BOOKED" && (
                  <button onClick={() => setStatus("BOOKED")} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark booked
                  </button>
                )}
                {stay.status !== "OPTION" && (
                  <button onClick={() => setStatus("OPTION")} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                    <CircleDashed className="w-3.5 h-3.5" /> Mark option
                  </button>
                )}
                {stay.status !== "CANCELLED" && (
                  <button onClick={() => setStatus("CANCELLED")} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                <div className="border-t border-border my-1" />
                <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editing && canEdit && (
        <div className="mt-4 grid gap-2 border-t border-border pt-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Stay name"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="rounded-lg border border-border bg-background/70 p-3">
            <div className="flex items-center gap-2">
              <input
                value={roomSiteInput}
                onChange={(e) => setRoomSiteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRoomSiteNumber();
                  }
                }}
                placeholder="Add room or site number"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={addRoomSiteNumber}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Add
              </button>
            </div>
            {roomSiteNumbers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {roomSiteNumbers.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => removeRoomSiteNumber(value)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors hover:border-destructive/35 hover:text-destructive"
                  >
                    {value} ×
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              aria-label="Arrival time"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              aria-label="Check-in date"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              aria-label="Check-in time"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              aria-label="Check-out date"
              min={checkIn || undefined}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              aria-label="Check-out time"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="time"
              value={leaveTime}
              onChange={(e) => setLeaveTime(e.target.value)}
              aria-label="Leave time"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="Total price"
              step="0.01"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Booking link"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
