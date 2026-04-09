"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Phase = "idle" | "processing" | "done";

export function MockPaymentSuccess({ onReset }: { onReset?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (phase !== "processing") return;
    const t = setInterval(() => {
      setProgress((p) => Math.min(100, p + 9));
    }, 120);
    const done = setTimeout(() => {
      setPhase("done");
      clearInterval(t);
    }, 1600);
    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
  }, [phase]);

  function start() {
    setProgress(8);
    setPhase("processing");
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Demo payment — no card is charged. This simulates a realtime
              checkout feel.
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={start}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
            >
              Pay deposit (demo)
            </motion.button>
          </motion.div>
        )}

        {phase === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur"
          >
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Processing payment…</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Animations only — Stripe is not connected in this build.
            </p>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <CheckCircle2 className="mx-auto size-14 text-primary" />
            </motion.div>
            <div>
              <p className="font-heading text-2xl font-semibold">Payment received</p>
              <p className="text-sm text-muted-foreground">
                Booking confirmed — SMS reminders are Coming soon.
              </p>
            </div>
            {onReset ? (
              <button
                type="button"
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setPhase("idle");
                  setProgress(8);
                  onReset();
                }}
              >
                Book another
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
