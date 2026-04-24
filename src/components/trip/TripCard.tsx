"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, MapPin, Calendar, Clock } from "lucide-react";
import { formatDateRange, daysUntil, gradientForId, tripDuration } from "@/lib/utils";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ROUTES } from "@/lib/constants";

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
}

export function TripCard({ trip, memberCount, members, stopCount }: TripCardProps) {
  const gradient = gradientForId(trip.id);
  const days = daysUntil(trip.startDate);
  const duration = tripDuration(trip.startDate, trip.endDate);

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Link href={ROUTES.tripOverview(trip.id)} className="block">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Cover */}
          <div className="h-36 relative overflow-hidden">
            {trip.coverImageUrl ? (
              <Image
                src={trip.coverImageUrl}
                alt={trip.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-300`}
              />
            )}
            {/* Status badge */}
            <div className="absolute top-3 right-3">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/30 text-white backdrop-blur-sm">
                {trip.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-base leading-tight mb-1 truncate">{trip.name}</h3>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              <AvatarGroup users={members} maxVisible={3} size="xs" />
            </div>

            {days !== null && days >= 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-primary">
                  {days === 0 ? "Trip starts today! 🎉" : `${days} day${days !== 1 ? "s" : ""} to go`}
                </p>
              </div>
            )}
            {days !== null && days < 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
