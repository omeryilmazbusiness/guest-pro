/**
 * HotelLoginShell — shared layout for tenant login screens (no tab switcher).
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { Card, CardContent } from "@/components/ui/card";
import { IOS_EASE, PAGE_ENTER } from "@/components/login/login-motion";

export interface HotelLoginShellProps {
  title: string;
  subtitle: string;
  formError?: string | null;
  children: React.ReactNode;
}

export function HotelLoginShell({ title, subtitle, formError, children }: HotelLoginShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-50/50 px-4 py-10 md:py-16">
      <motion.div
        className="w-full max-w-sm mx-auto space-y-8"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0.01 } : PAGE_ENTER}
      >
        <motion.header
          className="text-center space-y-4"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : { ...PAGE_ENTER, delay: 0.05 }}
        >
          <div className="flex flex-col items-center gap-5">
            <motion.div
              className="inline-flex items-center justify-center w-[88px] h-[88px] rounded-[28px] bg-white shadow-md shadow-zinc-200/60 border border-zinc-100/80"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : { type: "spring", stiffness: 420, damping: 28, delay: 0.08 }
              }
            >
              <GuestProLogo variant="login" />
            </motion.div>
            <div className="space-y-1.5">
              <h1 className="text-3xl font-serif tracking-tight text-zinc-900">{title}</h1>
              <p className="text-zinc-500 text-sm font-medium">{subtitle}</p>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            reduceMotion
              ? { duration: 0.01 }
              : { duration: 0.55, ease: IOS_EASE, delay: 0.12 }
          }
        >
          <Card className="border border-zinc-100 shadow-xl shadow-zinc-200/40 rounded-3xl bg-white">
            <CardContent className="p-6 md:p-8">
              <AnimatePresence initial={false}>
                {formError && (
                  <motion.div
                    key="login-error"
                    role="alert"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.28, ease: IOS_EASE }}
                    className="flex items-start gap-3 overflow-hidden rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
                    <span>{formError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {children}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
