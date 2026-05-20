/** Default inbox for landing-page demo requests (override via Vite env). */
export const DEMO_REQUEST_EMAIL =
  import.meta.env.VITE_DEMO_REQUEST_EMAIL?.trim() || "ryilmazomer@gmail.com";

export interface DemoRequestPayload {
  name: string;
  email: string;
  property: string;
  message: string;
}

export function buildDemoMailto(payload: DemoRequestPayload): string {
  const subject = encodeURIComponent(`Guest Pro demo request — ${payload.property}`);
  const body = encodeURIComponent(
    [
      "Hello Guest Pro team,",
      "",
      "I would like to schedule a product demo.",
      "",
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Property: ${payload.property}`,
      "",
      payload.message || "(No additional notes)",
    ].join("\n"),
  );
  return `mailto:${DEMO_REQUEST_EMAIL}?subject=${subject}&body=${body}`;
}
