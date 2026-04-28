/** Shared strings for swipe hint banner and account Tips dialog */

export const TRIP_NAV_TIPS = [
  {
    title: "Swipe between sections",
    body: 'On phones and tablets (under desktop width), swipe left or right anywhere on trip content—not on buttons or fields—to jump between Summary, Route, Costs, and the rest.',
  },
  {
    title: "Bottom bar",
    body: 'Use the tabs at the bottom for the main stops; open More for Votes and Members so each tab stays larger and easier to tap.',
  },
  {
    title: "Shortcuts on desktop",
    body: 'Press Ctrl K (⌘ K on Mac) to search, then go to Overview with G followed by O, Itinerary with G I, Expenses with G E, and so on.',
  },
] as const;

export const STORAGE_TRIP_SWIPE_HINT = "beacon.dismiss.tripSwipeHint.v1";
