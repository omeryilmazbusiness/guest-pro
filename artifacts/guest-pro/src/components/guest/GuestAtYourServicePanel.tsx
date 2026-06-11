import { useState } from "react";
import { Star, Wifi, Phone, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLocale } from "@/hooks/use-locale";
import { HOTEL_CONFIG } from "@/lib/welcoming/hotel-content";
import { createServiceRequest } from "@/lib/service-requests";
import { syncMyRequestToCache } from "@/lib/guest-my-requests-cache";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";

interface GuestAtYourServicePanelProps {
  appName?: string;
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
    <section className={dash.section} aria-label={t.infoSection}>
      <h3 className={dash.sectionTitle}>{t.infoSection}</h3>

      <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <header className="border-b border-white/[0.06] px-3 py-2.5">
          <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wide text-zinc-600">
            {t.atYourServiceHotelAbout}
          </p>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-zinc-300">
              <Building2 className="h-3 w-3" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium tracking-tight text-white">
                {HOTEL_CONFIG.name}
              </p>
              <p className="text-[10px] text-zinc-500">{appName}</p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
              <p className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                <Wifi className="h-2.5 w-2.5" strokeWidth={1.5} />
                {t.atYourServiceWifi}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-300">
                {HOTEL_CONFIG.wifi.ssid}
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
              <p className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-zinc-600">
                <Phone className="h-2.5 w-2.5" strokeWidth={1.5} />
                {t.atYourServiceEmergency}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-zinc-300">
                {HOTEL_CONFIG.emergency.number}
              </p>
            </div>
          </div>
        </header>

        <div className="border-b border-white/[0.06] px-3 py-2">
          <p className="text-[11px] font-medium text-zinc-300">{t.atYourServiceGuestProAbout}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
            {t.atYourServiceGuestProDesc}
          </p>
        </div>

        <div className="space-y-2.5 border-b border-white/[0.06] px-3 py-2.5">
          <div>
            <p className="text-[11px] font-medium text-zinc-300">{t.feedbackSectionTitle}</p>
            <p className="mt-0.5 text-[10px] text-zinc-600">{t.feedbackRatingLabel}</p>
            <div
              className="mt-1.5 flex items-center gap-0.5"
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

        <div className="space-y-2 px-3 py-2.5">
          <p className="text-[11px] font-medium text-zinc-300">{t.complaintSectionTitle}</p>
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
