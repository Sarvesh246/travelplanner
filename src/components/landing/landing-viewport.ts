/** whileInView: fire slightly before the section is visible to spread animation work (less scroll jank). */
export const LANDING_SECTION_VIEWPORT = {
  once: true,
  amount: 0.12,
  margin: "0px 0px 18% 0px",
} as const;
