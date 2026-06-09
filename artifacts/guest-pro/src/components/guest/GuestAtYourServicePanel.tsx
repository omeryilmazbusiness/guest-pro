import { useState } from "react";
import { Star, Wifi, Phone, Sparkles, Building2 } from "lucide-react";
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
      <h3 className={dash.sectionTitle}>
        {t.infoSection}
      </h3>

      <article className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl shadow-zinc-950/25">
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(255,255,255,0.09),transparent)]"
          aria-hidden
        />

        <header className="relative px-3.5 pt-4 pb-3 border-b border-white/[0.06]">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">
            {t.atYourServiceHotelAbout}
          </p>
          <div className="flex items-center gap-3 mb-2.5">
            <span className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white/90" strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-serif text-[17px] text-white tracking-tight leading-snug">
                {HOTEL_CONFIG.name}
              </p>
              <p className="text-[12px] text-zinc-400 mt-0.5">{appName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                {t.atYourServiceWifi}
              </p>
              <p className="text-[13px] text-zinc-200 mt-1 font-mono truncate">{HOTEL_CONFIG.wifi.ssid}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {t.atYourServiceEmergency}
              </p>
              <p className="text-[13px] text-zinc-200 mt-1 truncate">{HOTEL_CONFIG.emergency.number}</p>
            </div>
          </div>
        </header>

        <div className="relative px-3.5 py-3 border-b border-white/[0.06]">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white/80" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-white">{t.atYourServiceGuestProAbout}</p>
              <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">{t.atYourServiceGuestProDesc}</p>
            </div>
          </div>
        </div>

        <div className="relative px-3.5 py-3 border-b border-white/[0.06] space-y-4">
          <div>
            <p className="text-[13px] font-semibold text-white mb-1">{t.feedbackSectionTitle}</p>
            <p className="text-[12px] text-zinc-500 mb-3">{t.feedbackRatingLabel}</p>
            <div className="flex items-center gap-1" role="group" aria-label={t.feedbackRatingLabel}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label={`${value}`}
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      value <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-600",
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
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-[13px] text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={submitFeedback}
            disabled={submittingFeedback || rating < 1}
            className="w-full py-2.5 rounded-lg bg-white text-zinc-950 text-[13px] font-semibold hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submittingFeedback ? t.feedbackSubmitting : t.feedbackSubmit}
          </button>
        </div>

        <div className="relative px-3.5 py-3 space-y-3">
          <p className="text-[13px] font-semibold text-white">{t.complaintSectionTitle}</p>
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder={t.complaintPlaceholder}
            rows={2}
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 text-[13px] text-white placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={submitComplaint}
            disabled={submittingComplaint || !complaint.trim()}
            className="w-full py-2.5 rounded-lg border border-white/20 text-white text-[13px] font-semibold hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submittingComplaint ? t.feedbackSubmitting : t.complaintSubmit}
          </button>
        </div>
      </article>
    </section>
  );
}
