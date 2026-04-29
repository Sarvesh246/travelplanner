"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Calendar, DollarSign } from "lucide-react";
import { createTrip } from "@/actions/trips";
import { toast } from "sonner";
import { ROUTES, CURRENCIES } from "@/lib/constants";
import { slideRight } from "@/lib/motion";
import { useLoading } from "@/hooks/useLoading";
import { AppBackButton } from "@/components/layout/AppBackButton";

const STEPS = ["Details", "Dates and budget", "Done"];
const mobileFieldClass =
  "block w-full min-w-0 max-w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm";

export default function NewTripPage() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Trip name is required");
      return;
    }
    setLoading(true);
    startLoading("Creating your trip...");
    try {
      const { trip } = await createTrip({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency,
        budgetTarget: budget ? parseFloat(budget) : undefined,
      });
      toast.success("Trip created. Time to shape the route.");
      router.push(ROUTES.tripOverview(trip.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create this trip. Please try again.");
      setLoading(false);
      stopLoading();
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 flex min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] min-w-0 items-center gap-2 border-b border-border/70 bg-background/88 px-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pt-[max(0px,env(safe-area-inset-top,0px))] backdrop-blur-xl sm:gap-3 sm:px-4">
        <AppBackButton fallbackHref={ROUTES.dashboard} label="Back to dashboard" />
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 64 64" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="beaconGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'hsl(var(--secondary))', stopOpacity: 0.8}} />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.3" />
            <circle cx="32" cy="32" r="20" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.6" />
            <circle cx="32" cy="32" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.9" />
            <circle cx="32" cy="32" r="4" fill="hsl(var(--primary))" />
            <circle cx="32" cy="32" r="2.5" fill="hsl(var(--primary))" opacity="0.6" />
          </svg>
          <span className="font-bold">Beacon</span>
        </div>
      </header>

      <div className="flex-1 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto w-full max-w-xl">
          {/* Steps indicator */}
          <div className="mb-6 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-2 pr-4">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary/20 text-primary border-2 border-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`whitespace-nowrap text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" variants={slideRight} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <div>
                  <h2 className="mb-1 text-[clamp(1.9rem,6vw,2.25rem)] font-bold">Name your trip</h2>
                  <p className="text-muted-foreground text-sm">Choose a name your members will recognize.</p>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-border bg-card p-5 sm:p-6">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      <MapPin className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                      Trip name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Colorado Adventure 2025"
                      autoFocus
                      className={mobileFieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    placeholder="Where are you headed, and what should members know?"
                      rows={3}
                      className={`${mobileFieldClass} resize-none`}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => { if (name.trim()) setStep(1); else toast.error("Enter a trip name first"); }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" variants={slideRight} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <div>
                  <h2 className="mb-1 text-[clamp(1.9rem,6vw,2.25rem)] font-bold">Dates and budget</h2>
                  <p className="text-muted-foreground text-sm">Optional for now. Add what you know, refine the rest later.</p>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-border bg-card p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label className="text-sm font-medium block mb-1.5">
                        <Calendar className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                        Start date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={mobileFieldClass}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="text-sm font-medium block mb-1.5">End date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className={mobileFieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label className="text-sm font-medium block mb-1.5">
                        <DollarSign className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={mobileFieldClass}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className="text-sm font-medium block mb-1.5">Budget target</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="2000"
                        className={mobileFieldClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    onClick={() => setStep(0)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted sm:w-auto"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Create trip
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
