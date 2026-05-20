export type MarketingLocale = "en" | "tr" | "ar" | "ku";

export interface MarketingWelcomePhrase {
  text: string;
  dir: "ltr" | "rtl";
}

export interface MarketingTextBlock {
  title: string;
  description: string;
}

export interface MarketingHowStepText {
  title: string;
  problem: string;
  narrative: string;
  outcome: string;
}

export interface MarketingFeatureText {
  title: string;
  description: string;
  highlight: string;
}

export interface MarketingSolutionBeatText {
  problem: string;
  solution: string;
}

export interface HotelRoiText {
  value: string;
  suffix?: string;
  label: string;
  detail: string;
  figure: string;
}

export interface HotelStoryText {
  tag: string;
  title: string;
  hook: string;
  story: [string, string];
  metrics: [{ label: string; value: string }, { label: string; value: string }, { label: string; value: string }];
  outcome: string;
}

export interface MarketingTranslations {
  nav: {
    why: string;
    howItWorks: string;
    product: string;
    forHotels: string;
    demo: string;
  };
  lang: {
    menuLabel: string;
    en: string;
    tr: string;
    ar: string;
    ku: string;
  };
  header: {
    brand: string;
    requestDemo: string;
    signIn: string;
    menu: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    badge: string;
    tagline: string;
    taglineBrand: string;
    pillConcierge: string;
    pillLanguages: string;
    pillTranslator: string;
    requestDemo: string;
    seeHowItWorks: string;
    statConcierge: string;
    statCountries: string;
    statTranslator: string;
  };
  welcomePhrases: MarketingWelcomePhrase[];
  countries: string[];
  challenges: {
    label: string;
    title: string;
    intro: string;
    items: MarketingTextBlock[];
  };
  solution: {
    label: string;
    title: string;
    intro: string;
    problemLabel: string;
    guestProLabel: string;
    beats: MarketingSolutionBeatText[];
  };
  howItWorks: {
    label: string;
    title: string;
    intro: string;
    problemLabel: string;
    happensLabel: string;
    items: MarketingHowStepText[];
  };
  features: {
    label: string;
    title: string;
    intro: string;
    items: MarketingFeatureText[];
  };
  hotels: {
    label: string;
    title: string;
    subtitle: string;
    tiers: [string, string, string];
    bookDemo: string;
    roiWalkthrough: string;
    roiLabel: string;
    roiTitle: string;
    disclaimer: string;
    pillars: MarketingTextBlock[];
    storiesLabel: string;
    storiesTitle: string;
    roi: HotelRoiText[];
    stories: HotelStoryText[];
  };
  demo: {
    label: string;
    title: string;
    intro: string;
    requestDemo: string;
    guestSignIn: string;
    dialogTitle: string;
    dialogDesc: string;
    formName: string;
    formEmail: string;
    formProperty: string;
    formMessage: string;
    formSubmit: string;
    formSending: string;
    formNote: string;
    formNamePh: string;
    formEmailPh: string;
    formPropertyPh: string;
    formMessagePh: string;
    formError: string;
    formSuccess: string;
  };
  footer: {
    kioskPrompt: string;
    kioskLink: string;
    copyright: string;
  };
}
