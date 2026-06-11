import { motion, useReducedMotion } from "framer-motion";
import { GuestSkeleton } from "@/components/guest/GuestSkeleton";
import { GUEST_CONTENT_ENTER } from "@/lib/guest-motion";

function SectionLabel() {
  return <GuestSkeleton className="h-3 w-28 mb-2" rounded="rounded-md" />;
}

export function GuestHomeSkeleton() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="min-h-[100dvh] bg-[#F8F8F8]"
      role="status"
      aria-busy="true"
      aria-label="Loading guest dashboard"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.15 } : { ...GUEST_CONTENT_ENTER, duration: 0.45 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-zinc-100/80 bg-[#F8F8F8]/95 backdrop-blur-md px-3.5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GuestSkeleton className="h-9 w-9" rounded="rounded-xl" />
          <GuestSkeleton className="h-4 w-28" rounded="rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <GuestSkeleton className="h-9 w-9" rounded="rounded-xl" />
          <GuestSkeleton className="h-9 w-9" rounded="rounded-xl" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-3.5 pb-14">
        {/* Welcome */}
        <div className="pt-5 pb-1 flex justify-center">
          <GuestSkeleton className="h-3 w-36" rounded="rounded-md" />
        </div>

        {/* Voice hero */}
        <div className="mb-4 mt-2">
          <GuestSkeleton className="h-[268px] w-full" rounded="rounded-[28px]" />
        </div>

        {/* Ask something */}
        <div className="mb-4">
          <SectionLabel />
          <GuestSkeleton className="h-[72px] w-full" rounded="rounded-2xl" />
        </div>

        {/* Stay card */}
        <div className="mb-4">
          <GuestSkeleton className="h-[200px] w-full" rounded="rounded-2xl" />
        </div>

        {/* Quick actions */}
        <div className="mb-4">
          <SectionLabel />
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <GuestSkeleton className="h-[7.5rem]" rounded="rounded-[1.35rem]" />
            <GuestSkeleton className="h-[7.5rem]" rounded="rounded-[1.35rem]" />
            <GuestSkeleton className="h-[7.5rem]" rounded="rounded-[1.35rem]" />
          </div>
          <SectionLabel />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <GuestSkeleton key={i} className="h-[5.75rem]" rounded="rounded-[1.15rem]" />
            ))}
          </div>
        </div>

        {/* Nearby */}
        <div className="mb-4">
          <SectionLabel />
          <GuestSkeleton className="h-[180px] w-full" rounded="rounded-2xl" />
        </div>

        {/* Bill */}
        <div className="mb-4">
          <SectionLabel />
          <GuestSkeleton className="h-[64px] w-full" rounded="rounded-2xl" />
        </div>

        {/* Hotel links */}
        <div className="mb-4">
          <SectionLabel />
          <div className="space-y-2">
            <GuestSkeleton className="h-12 w-full" rounded="rounded-xl" />
            <GuestSkeleton className="h-12 w-full" rounded="rounded-xl" />
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <GuestSkeleton className="h-3 w-40" rounded="rounded-md" />
        </div>
      </main>
    </motion.div>
  );
}
