export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  newTrip: "/trips/new",
  trip: (id: string) => `/trips/${id}`,
  tripOverview: (id: string) => `/trips/${id}/overview`,
  tripItinerary: (id: string) => `/trips/${id}/itinerary`,
  /** Full-page view for a single stop (map + same stays/activities UI). */
  tripStop: (tripId: string, stopId: string) => `/trips/${tripId}/stops/${stopId}`,
  tripSupplies: (id: string) => `/trips/${id}/supplies`,
  tripExpenses: (id: string) => `/trips/${id}/expenses`,
  tripVotes: (id: string) => `/trips/${id}/votes`,
  tripMembers: (id: string) => `/trips/${id}/members`,
  invite: (token: string) => `/invite/${token}`,
} as const;

export const EXPENSE_CATEGORIES = [
  "Accommodation",
  "Food & Drinks",
  "Transportation",
  "Activities",
  "Gear & Supplies",
  "Medical",
  "Other",
] as const;

export const SUPPLY_CATEGORIES = [
  "Gear",
  "Clothing",
  "Food",
  "Medical",
  "Electronics",
  "Documents",
  "Toiletries",
  "Other",
] as const;

export const ACTIVITY_CATEGORIES = [
  "Hiking",
  "Food",
  "Sightseeing",
  "Transport",
  "Accommodation",
  "Adventure",
  "Culture",
  "Beach",
  "Nightlife",
  "Other",
] as const;

export const TRIP_GRADIENTS = [
  { from: "from-[hsl(126,38%,22%)]", to: "to-[hsl(110,28%,56%)]", name: "Forest trail" },
  { from: "from-[hsl(110,28%,48%)]", to: "to-[hsl(112,32%,70%)]", name: "Sage basin" },
  { from: "from-[hsl(112,28%,64%)]", to: "to-[hsl(50,38%,88%)]", name: "Mist ridge" },
  { from: "from-[hsl(126,34%,16%)]", to: "to-[hsl(110,30%,46%)]", name: "Deep timber" },
  { from: "from-[hsl(76,18%,84%)]", to: "to-[hsl(126,32%,28%)]", name: "Moss path" },
  { from: "from-[hsl(50,45%,82%)]", to: "to-[hsl(110,28%,52%)]", name: "Meadow light" },
] as const;

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
] as const;

export const MEMBER_ROLES = {
  OWNER: { label: "Owner", color: "role-owner" },
  ADMIN: { label: "Admin", color: "role-admin" },
  MEMBER: { label: "Member", color: "role-member" },
  VIEWER: { label: "Viewer", color: "role-viewer" },
} as const;

export const SUPPLY_STATUS_COLORS = {
  NEEDED: "text-destructive",
  PARTIALLY_COVERED: "text-warning",
  COVERED: "text-success",
  NOT_NEEDED: "text-muted-foreground",
} as const;

export const ACTIVITY_STATUS_COLORS = {
  IDEA: "status-idea",
  PLANNED: "status-planned",
  CONFIRMED: "status-confirmed",
  COMPLETED: "status-completed",
  CANCELLED: "status-cancelled",
} as const;

export const STAY_STATUS_COLORS = {
  OPTION: "status-idea",
  BOOKED: "status-planned",
  CANCELLED: "status-cancelled",
} as const;

/** Trip workflow status; matches Prisma `TripStatus` enum. */
export const TRIP_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PLANNING", label: "Planning" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];
