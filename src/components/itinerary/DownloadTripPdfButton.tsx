"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useTripContext } from "@/components/trip/TripContext";
import type { StopSerialized } from "./types";
import { formatCurrency, formatDateRange, formatTimeRange, formatTimeValue } from "@/lib/utils";
import { ACTIVITY_STATUS_LABELS } from "@/lib/constants";

interface DownloadTripPdfButtonProps {
  stops: StopSerialized[];
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function DownloadTripPdfButton({ stops }: DownloadTripPdfButtonProps) {
  const { trip } = useTripContext();
  const [downloading, setDownloading] = useState(false);

  function ensureSpace(doc: jsPDF, y: number, height: number) {
    if (y + height <= PAGE_HEIGHT - MARGIN) return y;
    doc.addPage();
    return MARGIN;
  }

  function addWrappedText(doc: jsPDF, text: string, x: number, y: number, options?: { size?: number; color?: number[]; lineHeight?: number }) {
    const size = options?.size ?? 11;
    const color = options?.color ?? [34, 40, 36];
    const lineHeight = options?.lineHeight ?? 5.6;
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - (x - MARGIN));
    const nextY = ensureSpace(doc, y, lines.length * lineHeight);
    doc.text(lines, x, nextY);
    return nextY + lines.length * lineHeight;
  }

  async function handleDownload() {
    try {
      setDownloading(true);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      let y = MARGIN;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(26, 34, 30);
      doc.text(trip.name, MARGIN, y);
      y += 9;

      doc.setFont("helvetica", "normal");
      y = addWrappedText(doc, formatDateRange(trip.startDate, trip.endDate), MARGIN, y, {
        size: 11,
        color: [88, 96, 92],
      });

      y += 2;

      for (const stop of stops) {
        y = ensureSpace(doc, y, 20);
        doc.setDrawColor(210, 221, 214);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 7;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(28, 36, 31);
        doc.text(stop.name, MARGIN, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        if (stop.country) {
          y = addWrappedText(doc, stop.country, MARGIN, y, {
            size: 10.5,
            color: [88, 96, 92],
          });
        }

        y = addWrappedText(
          doc,
          `Dates: ${formatDateRange(stop.arrivalDate, stop.departureDate)}`,
          MARGIN,
          y,
          { size: 10.5, color: [88, 96, 92] }
        );

        if (stop.stays.length > 0) {
          y += 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11.5);
          doc.setTextColor(39, 55, 46);
          doc.text("Stays", MARGIN, y);
          y += 5;

          doc.setFont("helvetica", "normal");
          for (const stay of stop.stays) {
            y = ensureSpace(doc, y, 16);
            y = addWrappedText(doc, `${stay.name} (${stay.status.toLowerCase()})`, MARGIN + 2, y, {
              size: 10.5,
            });

            if (stay.address) {
              y = addWrappedText(doc, stay.address, MARGIN + 6, y, {
                size: 9.5,
                color: [88, 96, 92],
              });
            }

            const stayLines = [
              stay.checkIn || stay.checkOut ? `Dates: ${formatDateRange(stay.checkIn, stay.checkOut)}` : null,
              `Arrive: ${formatTimeValue(stay.arrivalTime) ?? "TBD"}    Leave: ${formatTimeValue(stay.leaveTime) ?? "TBD"}`,
              `Check-in: ${formatTimeValue(stay.checkInTime) ?? "TBD"}    Check-out: ${formatTimeValue(stay.checkOutTime) ?? "TBD"}`,
              stay.totalPrice != null ? `Total: ${formatCurrency(stay.totalPrice, trip.currency)}` : null,
            ].filter(Boolean) as string[];

            for (const line of stayLines) {
              y = addWrappedText(doc, line, MARGIN + 6, y, { size: 9.5, color: [88, 96, 92] });
            }

            y += 2;
          }
        }

        if (stop.activities.length > 0) {
          y += 1;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11.5);
          doc.setTextColor(39, 55, 46);
          doc.text("Activities", MARGIN, y);
          y += 5;

          doc.setFont("helvetica", "normal");
          for (const activity of stop.activities) {
            y = ensureSpace(doc, y, 14);
            y = addWrappedText(
              doc,
              `${activity.name} (${ACTIVITY_STATUS_LABELS[activity.status].toLowerCase()})`,
              MARGIN + 2,
              y,
              { size: 10.5 }
            );

            const detailParts = [
              activity.scheduledDate ? `Date: ${activity.scheduledDate.slice(0, 10)}` : null,
              activity.startTime || activity.endTime ? `Time: ${formatTimeRange(activity.startTime, activity.endTime)}` : null,
              activity.durationMins != null ? `Duration: ${activity.durationMins} min` : null,
              activity.estimatedCost != null ? `Cost: ${formatCurrency(activity.estimatedCost, trip.currency)}` : null,
            ].filter(Boolean);

            if (detailParts.length > 0) {
              y = addWrappedText(doc, detailParts.join("    "), MARGIN + 6, y, {
                size: 9.5,
                color: [88, 96, 92],
              });
            }

            y += 2;
          }
        }

        y += 4;
      }

      const filename = `${trip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip"}-itinerary.pdf`;
      doc.save(filename);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 disabled:opacity-60"
    >
      {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Download PDF
    </button>
  );
}
