import { createRoot } from "react-dom/client";
import { setHotelSlugGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";
import { colegaPageForPath } from "@/lib/marketing-routes";

setHotelSlugGetter(() => getHotelSlugFromPath());

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
const colegaPage = colegaPageForPath(pathname);
if (colegaPage && colegaPage !== "index.html") {
  const escapeKey = "guestpro-marketing-shell-escape";
  if (sessionStorage.getItem(escapeKey) === pathname) {
    sessionStorage.removeItem(escapeKey);
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    window.location.replace(
      `${base}/colega/${colegaPage}${window.location.search}${window.location.hash}`,
    );
  } else {
    sessionStorage.setItem(escapeKey, pathname);
    window.location.reload();
  }
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
