import { useState } from "react";
import {
  Star,
  Wifi,
  Phone,
  Building2,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/hooks/use-locale";
import { HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
import { createServiceRequest } from "@/lib/service-requests";
import { syncMyRequestToCache } from "@/lib/guest-my-requests-cache";
import { cn } from "@/lib/utils";

interface GuestAtYourServicePanelProps {
  appName?: string;
}

const guestFramedDark =
  "overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.08]";

function ServiceIconTile({
  icon: Icon,
  label,
  value,
  iconClassName = "text-white",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-1 py-2 text-center">
      <span className="relative inline-flex h-12 w-12 items-center justify-center" aria-hidden>
        <Icon className={cn("guest-chat-entry-icon h-9 w-9", iconClassName)} strokeWidth={1.5} />
      </span>
      <span className="block w-full">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </span>
        <span className="mt-1 block break-words text-[12px] font-semibold leading-snug text-white">
          {value}
        </span>
      </span>
    </div>
  );
}

function SectionIconHeader({
  icon: Icon,
  title,
  iconClassName,
}: {
  icon: LucideIcon;
  title: string;
  iconClassName: string;
}) {
  return (
    <div className="mb-2.5 flex flex-col items-center gap-1.5 text-center">
      <span className="relative inline-flex h-11 w-11 items-center justify-center" aria-hidden>
        <Icon className={cn("h-9 w-9", iconClassName)} strokeWidth={1.5} />
      </span>
      <p className="text-[12px] font-semibold text-zinc-200">{title}</p>
    </div>
  );
}

export function GuestAtYourServicePanel({ appName = "Guest Pro" }: GuestAtYourServicePanelProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [complaint, setComplaint] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const displayRating = hoverRating || rating;

  const submitFeedback = async () => {
    if (rating < 1) {
      toast.error(t.feedbackRatingLabel);
      return;
    }
    setSubmittingFeedback(true);
    try {
      const created = await createServiceRequest({
        requestType: "GENERAL_SERVICE_REQUEST",
        summary: `Guest feedback · ${rating}★${comment.trim() ? ` · ${comment.trim().slice(0, 80)}` : ""}`,
        structuredData: {
          kind: "guest_feedback",
          rating,
          comment: comment.trim() || null,
        },
      });
      syncMyRequestToCache(queryClient, created);
      toast.success(t.feedbackSuccessToast);
      setComment("");
      setRating(0);
    } catch {
      toast.error(t.sendFailed);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const submitComplaint = async () => {
    const text = complaint.trim();
    if (!text) return;
    setSubmittingComplaint(true);
    try {
      const created = await createServiceRequest({
        requestType: "SUPPORT_REQUEST",
        summary: text.slice(0, 200),
        structuredData: { kind: "guest_complaint_suggestion", message: text },
      });
      syncMyRequestToCache(queryClient, created);
      toast.success(t.complaintSuccessToast);
      setComplaint("");
    } catch {
      toast.error(t.sendFailed);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <section aria-label={t.infoSection}>
      <article className={guestFramedDark}>
        <div className="border-b border-white/[0.06] px-4 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {t.infoSection}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-0 gap-y-1 border-b border-white/[0.06] px-2 py-1">
          <ServiceIconTile
            icon={Building2}
            label={t.atYourServiceHotelAbout}
            value={HOTEL_CONFIG.name}
          />
          <ServiceIconTile
            icon={Wifi}
            label={t.atYourServiceWifi}
            value={HOTEL_CONFIG.wifi.ssid}
            iconClassName="text-sky-400"
          />
          <ServiceIconTile
            icon={Phone}
            label={t.atYourServiceEmergency}
            value={HOTEL_CONFIG.emergency.number}
            iconClassName="text-rose-400"
          />
        </div>

        <div className="flex items-center justify-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-center">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-zinc-500" strokeWidth={1.75} />
          <p className="text-[10px] leading-snug text-zinc-500">
            <span className="font-medium text-zinc-400">{t.atYourServiceGuestProAbout}</span>
            {" · "}
            {t.atYourServiceGuestProDesc}
          </p>
        </div>

        <div className="space-y-2.5 border-b border-white/[0.06] px-3 py-3">
          <SectionIconHeader
            icon={Star}
            title={t.feedbackSectionTitle}
            iconClassName="guest-chat-entry-icon fill-amber-400/20 text-amber-400"
          />
          <p className="-mt-1 text-center text-[10px] text-zinc-600">{t.feedbackRatingLabel}</p>
          <div
            className="flex items-center justify-center gap-0.5"
            role="group"
            aria-label={t.feedbackRatingLabel}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="rounded-md p-0.5 transition-colors hover:bg-white/5"
                aria-label={`${value}`}
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition-colors",
                    value <= displayRating ? "fill-amber-400 text-amber-400" : "text-zinc-700",
                  )}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.feedbackCommentPlaceholder}
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/15"
          />
          <button
            type="button"
            onClick={submitFeedback}
            disabled={submittingFeedback || rating < 1}
            className="w-full rounded-lg bg-white py-2 text-[12px] font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submittingFeedback ? t.feedbackSubmitting : t.feedbackSubmit}
          </button>
        </div>

        <div className="space-y-2 px-3 py-3">
          <SectionIconHeader
            icon={MessageSquare}
            title={t.complaintSectionTitle}
            iconClassName="guest-chat-entry-icon text-zinc-300"
          />
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder={t.complaintPlaceholder}
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/15"
          />
          <button
            type="button"
            onClick={submitComplaint}
            disabled={submittingComplaint || !complaint.trim()}
            className="w-full rounded-lg border border-white/15 py-2 text-[12px] font-semibold text-zinc-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submittingComplaint ? t.feedbackSubmitting : t.complaintSubmit}
          </button>
        </div>
      </article>
    </section>
  );
}
