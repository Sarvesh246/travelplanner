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
  { from: "from-sky-400", to: "to-indigo-500", name: "Ocean" },
  { from: "from-orange-400", to: "to-pink-500", name: "Sunset" },
  { from: "from-emerald-400", to: "to-sky-500", name: "Forest" },
  { from: "from-violet-400", to: "to-pink-500", name: "Dusk" },
  { from: "from-amber-400", to: "to-lime-400", name: "Sand" },
  { from: "from-slate-600", to: "to-slate-800", name: "Night" },
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
  OWNER: { label: "Owner", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  MEMBER: { label: "Member", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
} as const;

export const SUPPLY_STATUS_COLORS = {
  NEEDED: "text-destructive",
  PARTIALLY_COVERED: "text-warning",
  COVERED: "text-success",
  NOT_NEEDED: "text-muted-foreground",
} as const;

export const ACTIVITY_STATUS_COLORS = {
  IDEA: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  COMPLETED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
} as const;

export const STAY_STATUS_COLORS = {
  OPTION: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  BOOKED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
} as const;
