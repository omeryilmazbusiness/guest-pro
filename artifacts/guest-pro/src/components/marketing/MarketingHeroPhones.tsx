import guestHomeScreenImg from "@assets/marketing/guest-home-screen.png";
import loginScreenImg from "@assets/marketing/login-screen.png";
import { IPhoneMockup } from "@/components/ui/iphone-mockup";
import { cn } from "@/lib/utils";

const FRAME_COLOR = "#3a3a3e";

const BASE_PHONE = {
  model: "15-pro" as const,
  color: FRAME_COLOR,
  screenBg: "#f8f8f8",
  wallpaperFit: "cover" as const,
  wallpaperPosition: "top center",
  safeArea: false,
  showHomeIndicator: true,
  shadow: "none",
};

interface MarketingHeroPhonesProps {
  className?: string;
}

export function MarketingHeroPhones({ className }: MarketingHeroPhonesProps) {
  return (
    <div className={cn("marketing-hero__phone-scaler", className)}>
      <div className="marketing-hero__phone-duo" aria-hidden="true">
        <div className="marketing-hero__phone-duo-item marketing-hero__phone-duo-item--left">
          <IPhoneMockup {...BASE_PHONE} wallpaper={loginScreenImg} />
        </div>
        <div className="marketing-hero__phone-duo-item marketing-hero__phone-duo-item--right">
          <IPhoneMockup {...BASE_PHONE} wallpaper={guestHomeScreenImg} />
        </div>
        <div className="marketing-hero__phone-floor-shadow" />
      </div>
    </div>
  );
}
