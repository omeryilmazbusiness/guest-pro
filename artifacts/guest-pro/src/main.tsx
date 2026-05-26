import { createRoot } from "react-dom/client";
import { setHotelSlugGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import { getHotelSlugFromPath } from "@/lib/hotel-slug-from-path";

setHotelSlugGetter(() => getHotelSlugFromPath());

createRoot(document.getElementById("root")!).render(<App />);
