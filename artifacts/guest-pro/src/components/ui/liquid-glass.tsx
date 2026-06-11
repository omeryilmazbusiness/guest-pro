import type { CSSProperties, ReactNode } from "react";
import {
  Bot,
  Compass,
  Map,
  MessageCircle,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassEffectProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  href?: string;
  target?: string;
  /** When false, removes pointer cursor (e.g. static cards). */
  interactive?: boolean;
}

export interface DockIcon {
  src: string;
  alt: string;
  onClick?: () => void;
}

export interface LucideDockIcon {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

const GLASS_EASE = "cubic-bezier(0.175, 0.885, 0.32, 2.2)";

/** Frosted liquid-glass surface with SVG distortion filter. */
export function GlassEffect({
  children,
  className,
  style,
  href,
  target = "_blank",
  interactive = true,
}: GlassEffectProps) {
  const glassStyle: CSSProperties = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: GLASS_EASE,
    ...style,
  };

  const content = (
    <div
      className={cn(
        "relative flex overflow-hidden font-semibold text-zinc-900 transition-all duration-700",
        interactive && "cursor-pointer",
        className,
      )}
      style={glassStyle}
    >
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: "rgba(255, 255, 255, 0.25)" }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
        }}
        aria-hidden
      />
      <div className="relative z-30 w-full">{children}</div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={target} rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}

export function GlassDock({
  icons,
  href,
  className,
}: {
  icons: DockIcon[];
  href?: string;
  className?: string;
}) {
  return (
    <GlassEffect href={href} className={cn("rounded-3xl p-3 hover:p-4", className)}>
      <div className="flex items-center justify-center gap-2 overflow-hidden rounded-3xl p-3 py-0 px-0.5">
        {icons.map((icon, index) => (
          <img
            key={index}
            src={icon.src}
            alt={icon.alt}
            className="h-16 w-16 cursor-pointer transition-all duration-700 hover:scale-110"
            style={{ transformOrigin: "center center", transitionTimingFunction: GLASS_EASE }}
            onClick={icon.onClick}
          />
        ))}
      </div>
    </GlassEffect>
  );
}

export function GlassLucideDock({
  icons,
  className,
}: {
  icons: LucideDockIcon[];
  className?: string;
}) {
  return (
    <GlassEffect interactive={false} className={cn("rounded-3xl p-3", className)}>
      <div className="flex items-center justify-center gap-3 px-2 py-3">
        {icons.map(({ icon: Icon, label, onClick }, index) => (
          <button
            key={index}
            type="button"
            onClick={onClick}
            aria-label={label}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white transition-all duration-700 hover:scale-110 hover:bg-white/30"
            style={{ transitionTimingFunction: GLASS_EASE }}
          >
            <Icon className="h-7 w-7" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </GlassEffect>
  );
}

export function GlassButton({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <GlassEffect
      href={href}
      className={cn(
        "overflow-hidden rounded-3xl px-10 py-6 hover:rounded-[2rem] hover:px-11 hover:py-7",
        className,
      )}
    >
      <div
        className="transition-all duration-700 hover:scale-95"
        style={{ transitionTimingFunction: GLASS_EASE }}
      >
        {children}
      </div>
    </GlassEffect>
  );
}

/** Mount once near the app root — powers all GlassEffect surfaces. */
export function GlassFilter() {
  return (
    <svg style={{ display: "none" }} aria-hidden>
      <filter
        id="glass-distortion"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.001 0.005"
          numOctaves="1"
          seed="17"
          result="turbulence"
        />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feSpecularLighting
          in="softMap"
          surfaceScale="5"
          specularConstant="1"
          specularExponent="100"
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite
          in="specLight"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="litImage"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="200"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

/** Full-page showcase — useful for design QA. */
export function LiquidGlassShowcase() {
  const dockIcons: LucideDockIcon[] = [
    { icon: Sparkles, label: "AI" },
    { icon: MessageCircle, label: "Chat" },
    { icon: Bot, label: "Concierge" },
    { icon: Map, label: "Map" },
    { icon: Compass, label: "Explore" },
    { icon: UtensilsCrossed, label: "Dining" },
  ];

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden font-light"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop")',
        backgroundPosition: "center center",
        backgroundSize: "cover",
        animation: "moveBackground 60s linear infinite",
      }}
    >
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <GlassLucideDock icons={dockIcons} />
        <GlassButton>
          <div className="text-xl text-white">
            <p>How can I help you today?</p>
          </div>
        </GlassButton>
      </div>
    </div>
  );
}

/** @deprecated Use LiquidGlassShowcase — kept for demo imports. */
export const Component = LiquidGlassShowcase;
