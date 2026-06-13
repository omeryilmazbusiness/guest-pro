import type { ComponentType } from "react";
import GuestHome from "@/pages/guest/home";
import GuestChat from "@/pages/guest/chat";
import GuestLiveChat from "@/pages/guest/live-chat";
import GuestFlow from "@/pages/guest/flow";
import GuestAutoLogin from "@/pages/guest/auto-login";
import PassportScanPage from "@/pages/guest/passport-scan";
import { GuestPageTransition } from "@/components/guest/GuestPageTransition";

function withGuestMotion<P extends object>(Page: ComponentType<P>) {
  return function GuestMotionPage(props: P) {
    return (
      <GuestPageTransition>
        <Page {...props} />
      </GuestPageTransition>
    );
  };
}

export const GuestHomePage = withGuestMotion(GuestHome);
export const GuestChatPage = withGuestMotion(GuestChat);
export const GuestLiveChatPage = withGuestMotion(GuestLiveChat);
export const GuestFlowPage = withGuestMotion(GuestFlow);
export const GuestAutoLoginPage = withGuestMotion(GuestAutoLogin);
export const GuestPassportScanPage = withGuestMotion(PassportScanPage);
