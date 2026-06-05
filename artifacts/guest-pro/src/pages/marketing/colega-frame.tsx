import type { ColegaPage } from "@/lib/marketing-routes";

type MarketingColegaFrameProps = {
  page: ColegaPage;
  title: string;
};

export function MarketingColegaFrame({ page, title }: MarketingColegaFrameProps) {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  const src = `${base}/colega/${page}`;

  return (
    <div className="min-h-svh min-h-dvh bg-black">
      <iframe
        title={title}
        src={src}
        className="h-[100svh] w-full border-0"
        referrerPolicy="no-referrer"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        loading="eager"
      />
    </div>
  );
}
