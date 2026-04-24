"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ArrowLeft, ArrowRight, Check, Loader2, MapPin, Calendar, DollarSign } from "lucide-react";
import { createTrip } from "@/actions/trips";
import { toast } from "sonner";
import { ROUTES, CURRENCIES } from "@/lib/constants";
import { fadeUp, slideRight } from "@/lib/motion";
import Link from "next/link";

const STEPS = ["Details", "Dates & Budget", "Done"];

export default function NewTripPage() {
  const router = useRouter();
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
    try {
      const { trip } = await createTrip({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency,
        budgetTarget: budget ? parseFloat(budget) : undefined,
      });
      toast.success("Trip created! Let's start planning 🎉");
      router.push(ROUTES.tripOverview(trip.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create trip");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border flex items-center px-4 gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Plane className="w-3.5 h-3.5 text-white rotate-45" />
          </div>
          <span className="font-bold">Groovy</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < step ? "bg-primary text-white" :
                  i === step ? "bg-primary/20 text-primary border-2 border-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" variants={slideRight} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Name your trip</h2>
                  <p className="text-muted-foreground text-sm">Give it a fun, memorable name</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
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
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's the vibe? What are you planning?"
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => { if (name.trim()) setStep(1); else toast.error("Enter a trip name first"); }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" variants={slideRight} initial="initial" animate="animate" exit="exit" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Dates & Budget</h2>
                  <p className="text-muted-foreground text-sm">Optional — you can fill this in later</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        <Calendar className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                        Start date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">End date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        <DollarSign className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Budget target</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="2000"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium border border-border hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Create Trip
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
