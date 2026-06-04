export default function MarketingHome() {
  return (
    <div className="min-h-svh min-h-dvh bg-black">
      <iframe
        title="Guest Pro — Colega template"
        src={`${import.meta.env.BASE_URL.replace(/\/+$/, "")}/colega/index.html`}
        className="h-[100svh] w-full border-0"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
