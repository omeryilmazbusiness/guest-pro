/** YouTube hero background — keep in sync with public/colega/js/guestpro-youtube-hero.js */

export const GUESTPRO_HERO_YOUTUBE_ID = "cdKx1Zv3YKs";

export const GUESTPRO_HERO_YOUTUBE_URL =
  "https://youtu.be/cdKx1Zv3YKs?si=EO_7wvCAhkexfe4n";

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function parseYoutubeVideoId(urlOrId: string): string | null {
  const s = urlOrId.trim();
  if (YOUTUBE_ID_RE.test(s)) return s;

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = s.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function buildYoutubeHeroEmbedUrl(
  videoId: string,
  origin?: string,
): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: videoId,
    controls: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0",
  });

  if (origin) params.set("origin", origin);

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
