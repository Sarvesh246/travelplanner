export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  newTrip: "/trips/new",
  trip: (id: string) => `/trips/${id}`,
  tripOverview: (id: string) => `/trips/${id}/overview`,
  tripItinerary: (id: string) => `/trips/${id}/itinerary`,
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
  { from: "from-[hsl(38,90%,56%)]", to: "to-[hsl(24,90%,52%)]", name: "Sunrise pass" },
  { from: "from-[hsl(215,45%,48%)]", to: "to-[hsl(222,35%,35%)]", name: "High ridge" },
  { from: "from-[hsl(16,58%,52%)]", to: "to-[hsl(38,85%,48%)]", name: "Canyon" },
  { from: "from-[hsl(222,28%,28%)]", to: "to-[hsl(38,90%,56%)]", name: "Twilight trail" },
  { from: "from-[hsl(200,55%,45%)]", to: "to-[hsl(215,40%,38%)]", name: "Alpine lake" },
  { from: "from-[hsl(32,85%,48%)]", to: "to-[hsl(16,55%,48%)]", name: "Desert bloom" },
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
