import { useMemo, useState } from "react";
import { Download, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { useLocale } from "@/hooks/use-locale";
import { getHotelLogoSrc } from "@/lib/hotel-logo";
import { downloadRoadmapPostcard } from "@/lib/roadmap-postcard";
import { resolveRoadmapScenery } from "@/lib/roadmap-scenery";
import {
  type ChatRoadmap,
  groupRoadmapStops,
  roadmapSectionTitle,
  stopCategoryEmoji,
  type RoadmapSectionId,
} from "@/lib/chat-roadmap";

interface ChatRoadmapCardProps {
  roadmap: ChatRoadmap;
}

const SECTION_DOT: Record<RoadmapSectionId, string> = {
  sights: "bg-indigo-500",
  flavors: "bg-amber-500",
  experiences: "bg-emerald-500",
};

export function ChatRoadmapCard({ roadmap }: ChatRoadmapCardProps) {
  const { t } = useLocale();
  const { hotelName, logoUrl } = useHotelDisplay();
  const tenant = useOptionalHotelTenant();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const scenery = useMemo(() => resolveRoadmapScenery(roadmap.city), [roadmap.city]);
  const sections = groupRoadmapStops(roadmap.stops);
  let stopIndex = 0;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const hotelLogo = getHotelLogoSrc(tenant?.slug ?? "", logoUrl);
      await downloadRoadmapPostcard({
        roadmap,
        hotelName,
        hotelLogoUrl: hotelLogo,
        guestFirstName: user?.firstName ?? undefined,
        t,
      });
      toast.success(t.roadmapDownloadReady);
    } catch {
      toast.error(t.roadmapDownloadError);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-2 max-w-[96%] overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)]">
      {/* Compact premium header */}
      <div
        className="relative px-3.5 py-3"
        style={{ background: scenery.gradientCss }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/75">
              {t.roadmapPostcardTagline}
            </p>
            <h3 className="mt-0.5 text-[14px] font-semibold leading-snug text-white">
              {roadmap.title}
            </h3>
            {roadmap.city && (
              <p className="mt-0.5 text-[11px] font-medium text-white/80">{roadmap.city}</p>
            )}
          </div>
        </div>
        {roadmap.summary && (
          <p className="relative mt-2 line-clamp-2 text-[11px] leading-snug text-white/85">
            {roadmap.summary}
          </p>
        )}
      </div>

      {/* Roadmap trail */}
      <div className="px-3 py-2.5">
        {sections.map((section) => (
          <div key={section.id} className="mb-2 last:mb-0">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${SECTION_DOT[section.id]}`} />
              <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                {roadmapSectionTitle(section.id, t)}
              </span>
            </div>
            <ol className="relative ms-1 border-s-2 border-dashed border-zinc-200 ps-4">
              {section.stops.map((stop) => {
                stopIndex += 1;
                const n = stopIndex;
                return (
                  <li
                    key={`${section.id}-${stop.title}-${n}`}
                    className="relative pb-2.5 last:pb-0"
                  >
                    <span
                      className="absolute -start-[1.35rem] top-0 flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-[11px] shadow-sm"
                      aria-hidden
                    >
                      {stopCategoryEmoji(stop.category)}
                    </span>
                    <div className="min-w-0 rounded-xl bg-zinc-50/90 px-2.5 py-2">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="text-[10px] font-bold tabular-nums"
                          style={{ color: scenery.accent }}
                        >
                          {n}
                        </span>
                        <p className="text-[12px] font-semibold leading-snug text-zinc-900">
                          {stop.title}
                        </p>
                      </div>
                      {stop.subtitle && (
                        <p className="mt-0.5 ps-4 text-[10px] leading-snug text-zinc-500">
                          {stop.subtitle}
                        </p>
                      )}
                      {stop.duration && (
                        <span className="mt-1 ms-4 inline-flex rounded-md bg-white px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 ring-1 ring-zinc-100">
                          {stop.duration}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-100 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-70"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Download className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          )}
          {downloading ? t.roadmapDownloading : t.roadmapDownloadLabel}
        </button>
      </div>
    </div>
  );
}
