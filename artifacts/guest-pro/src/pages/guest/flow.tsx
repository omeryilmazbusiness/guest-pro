import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  UtensilsCrossed,
  Coffee,
  Leaf,
  Sunrise,
  Wine,
  Moon,
  Sparkles,
  DoorOpen,
  Wifi,
  Volume2,
  Package,
  MessageSquare,
  Wind,
  Bell,
  Heart,
  Utensils,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/hooks/use-locale";
import { createServiceRequest, type ServiceRequestType } from "@/lib/service-requests";
import type { GuestTranslations } from "@/lib/i18n";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowMode = "food" | "support" | "care";

interface StepOption {
  value: string;  // semantic key — stored in structuredData, language-neutral
  label: string;  // localized display label from t
  subtitle?: string;
  icon: LucideIcon;
}

interface WizardStep {
  id: string;
  question: string;
  subtitle?: string;
  type: "select" | "text" | "confirm";
  options?: StepOption[];
  skippable?: boolean;
  careIntro?: boolean;
}

// ─── Turkish food menu items (hotel-specific dish names, not translated) ──────

const FOOD_MENU_RAW: Record<string, { value: string; subtitle: string; icon: LucideIcon }[]> = {
  breakfast: [
    { value: "Serpme Kahvaltı", subtitle: "Peynir, zeytin, bal, reçel", icon: UtensilsCrossed },
    { value: "Omlet", subtitle: "Seçiminize göre iç malzeme", icon: Utensils },
    { value: "Avokado Tost", subtitle: "Ekşi maya ekmek, haşlanmış yumurta", icon: Utensils },
    { value: "Taze Meyve Tabağı", subtitle: "Mevsim meyveleri", icon: Leaf },
  ],
  light: [
    { value: "Ekmeğe Yumurta", subtitle: "El yapımı ekmek", icon: Utensils },
    { value: "Peynirli Sandviç", subtitle: "Izgara peynirli sandviç", icon: Utensils },
    { value: "Günün Çorbası", subtitle: "Şefin günlük seçimi", icon: Utensils },
    { value: "Salata", subtitle: "Tercih ettiğiniz sos ile", icon: Leaf },
  ],
  main: [
    { value: "Izgara Tavuk", subtitle: "Mevsim sebzeli", icon: UtensilsCrossed },
    { value: "Şefin Makarnası", subtitle: "Günlük özel makarna", icon: UtensilsCrossed },
    { value: "Tavada Balık", subtitle: "Günün balığı", icon: UtensilsCrossed },
    { value: "Vejetaryen Tabak", subtitle: "Mevsim sebze & tahıl", icon: Leaf },
  ],
  drinks: [
    { value: "Türk Çayı", subtitle: "Demlik çay", icon: Coffee },
    { value: "Kahve", subtitle: "Türk kahvesi veya filtre", icon: Coffee },
    { value: "Taze Portakal Suyu", subtitle: "Taze sıkılmış", icon: Coffee },
    { value: "Su / Maden Suyu", subtitle: "Sade veya köpüklü", icon: Coffee },
  ],
};

// ─── Step builders (i18n-driven) ──────────────────────────────────────────────

function buildFoodSteps(t: GuestTranslations): WizardStep[] {
  const categories: StepOption[] = [
    { value: "breakfast", label: t.flowCatBreakfast, subtitle: t.flowCatBreakfastHint, icon: Sunrise },
    { value: "light", label: t.flowCatLight, subtitle: t.flowCatLightHint, icon: Leaf },
    { value: "main", label: t.flowCatMain, subtitle: t.flowCatMainHint, icon: UtensilsCrossed },
    { value: "drinks", label: t.flowCatDrinks, subtitle: t.flowCatDrinksHint, icon: Coffee },
  ];

  const quantities: StepOption[] = [
    { value: "1", label: t.flowQty1, icon: Utensils },
    { value: "2", label: t.flowQty2, icon: Utensils },
    { value: "3", label: t.flowQty3, icon: Utensils },
  ];

  return [
    { id: "category", question: t.flowFoodCategoryQ, subtitle: t.flowFoodCategoryHint, type: "select", options: categories },
    { id: "item", question: t.flowFoodItemQ, subtitle: t.flowFoodItemHint, type: "select", options: [] },
    { id: "quantity", question: t.flowFoodQuantityQ, type: "select", options: quantities },
    { id: "note", question: t.flowFoodNoteQ, subtitle: t.flowFoodNoteHint, type: "text", skippable: true },
    { id: "confirm", question: t.flowFoodConfirmQ, type: "confirm" },
  ];
}

function buildSupportSteps(t: GuestTranslations): WizardStep[] {
  return [
    {
      id: "issueType",
      question: t.flowSupportIssueQ,
      subtitle: t.flowSupportIssueHint,
      type: "select",
      options: [
        { value: "MINIBAR_REFRESH", label: t.flowIssueMinibark, subtitle: t.flowIssueMinibarHint, icon: Wine },
        { value: "EXTRA_PILLOW", label: t.flowIssuePillow, subtitle: t.flowIssuePillowHint, icon: Moon },
        { value: "ROOM_CLEANING", label: t.flowIssueCleaning, subtitle: t.flowIssueCleaningHint, icon: Sparkles },
        { value: "ROOM_ISSUE", label: t.flowIssueRoomIssue, subtitle: t.flowIssueRoomIssueHint, icon: DoorOpen },
        { value: "TECH_ISSUE", label: t.flowIssueTechIssue, subtitle: t.flowIssueTechIssueHint, icon: Wifi },
        { value: "NOISE_COMPLAINT", label: t.flowIssueNoise, subtitle: t.flowIssueNoiseHint, icon: Volume2 },
        { value: "EXTRA_SUPPLIES", label: t.flowIssueExtra, subtitle: t.flowIssueExtraHint, icon: Package },
        { value: "OTHER", label: t.flowIssueOther, subtitle: t.flowIssueOtherHint, icon: MessageSquare },
      ],
    },
    {
      id: "urgency",
      question: t.flowSupportUrgencyQ,
      type: "select",
      options: [
        { value: "URGENT", label: t.flowUrgUrgent, subtitle: t.flowUrgUrgentHint, icon: Bell },
        { value: "NORMAL", label: t.flowUrgNormal, subtitle: t.flowUrgNormalHint, icon: Utensils },
      ],
    },
    { id: "note", question: t.flowSupportNoteQ, subtitle: t.flowSupportNoteHint, type: "text", skippable: true },
    { id: "confirm", question: t.flowSupportConfirmQ, type: "confirm" },
  ];
}

function buildCareSteps(t: GuestTranslations): WizardStep[] {
  return [
    {
      id: "freetext",
      question: t.flowCareIntroQ,
      subtitle: t.flowCareIntroHint,
      type: "text",
      skippable: false,
      careIntro: true,
    },
    {
      id: "sleep",
      question: t.flowCareSleepQ,
      type: "select",
      skippable: true,
      options: [
        { value: "EARLY", label: t.flowSleepEarly, subtitle: t.flowSleepEarlyHint, icon: Moon },
        { value: "NORMAL", label: t.flowSleepNormal, subtitle: t.flowSleepNormalHint, icon: Moon },
        { value: "LATE", label: t.flowSleepLate, subtitle: t.flowSleepLateHint, icon: Moon },
      ],
    },
    {
      id: "diet",
      question: t.flowCareDietQ,
      type: "select",
      skippable: true,
      options: [
        { value: "NORMAL", label: t.flowDietNormal, subtitle: t.flowDietNormalHint, icon: UtensilsCrossed },
        { value: "VEGETARIAN", label: t.flowDietVeg, subtitle: t.flowDietVegHint, icon: Leaf },
        { value: "VEGAN", label: t.flowDietVegan, subtitle: t.flowDietVeganHint, icon: Leaf },
        { value: "GLUTEN_FREE", label: t.flowDietGluten, subtitle: t.flowDietGlutenHint, icon: Leaf },
        { value: "HALAL", label: t.flowDietHalal, subtitle: t.flowDietHalalHint, icon: UtensilsCrossed },
      ],
    },
    {
      id: "comfort",
      question: t.flowCareComfortQ,
      type: "select",
      skippable: true,
      options: [
        { value: "STANDARD", label: t.flowComfortStd, subtitle: t.flowComfortStdHint, icon: Heart },
        { value: "EXTRA_PILLOW", label: t.flowComfortPillow, subtitle: t.flowComfortPillowHint, icon: Moon },
        { value: "EXTRA_BLANKET", label: t.flowComfortBlanket, subtitle: t.flowComfortBlanketHint, icon: Moon },
        { value: "COOL_ROOM", label: t.flowComfortCool, subtitle: t.flowComfortCoolHint, icon: Wind },
        { value: "WARM_ROOM", label: t.flowComfortWarm, subtitle: t.flowComfortWarmHint, icon: Wind },
      ],
    },
    {
      id: "service",
      question: t.flowCareServiceQ,
      type: "select",
      skippable: true,
      options: [
        { value: "FULL_SERVICE", label: t.flowServiceFull, subtitle: t.flowServiceFullHint, icon: Bell },
        { value: "MINIMAL_DISTURBANCE", label: t.flowServiceMin, subtitle: t.flowServiceMinHint, icon: Bell },
      ],
    },
    { id: "confirm", question: t.flowCareConfirmQ, type: "confirm" },
  ];
}

// ─── Flow config builder ──────────────────────────────────────────────────────

interface FlowConfig {
  steps: WizardStep[];
  requestType: ServiceRequestType;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentIconBg: string;
  label: string;
  icon: LucideIcon;
  successMessage: string;
}

function buildFlowConfig(t: GuestTranslations, mode: FlowMode): FlowConfig {
  const base: Record<FlowMode, Omit<FlowConfig, "steps" | "label" | "successMessage">> = {
    food: {
      requestType: "FOOD_ORDER",
      accentBg: "bg-amber-50",
      accentBorder: "border-amber-200",
      accentText: "text-amber-700",
      accentIconBg: "bg-amber-100",
      icon: UtensilsCrossed,
    },
    support: {
      requestType: "SUPPORT_REQUEST",
      accentBg: "bg-sky-50",
      accentBorder: "border-sky-200",
      accentText: "text-sky-700",
      accentIconBg: "bg-sky-100",
      icon: Bell,
    },
    care: {
      requestType: "CARE_PROFILE_UPDATE",
      accentBg: "bg-rose-50",
      accentBorder: "border-rose-200",
      accentText: "text-rose-600",
      accentIconBg: "bg-rose-100",
      icon: Heart,
    },
  };

  const labels: Record<FlowMode, string> = {
    food: t.flowFoodLabel,
    support: t.flowSupportLabel,
    care: t.flowCareLabel,
  };

  const successMessages: Record<FlowMode, string> = {
    food: t.flowFoodSuccess,
    support: t.flowSupportSuccess,
    care: t.flowCareSuccess,
  };

  const steps: Record<FlowMode, WizardStep[]> = {
    food: buildFoodSteps(t),
    support: buildSupportSteps(t),
    care: buildCareSteps(t),
  };

  return {
    ...base[mode],
    steps: steps[mode],
    label: labels[mode],
    successMessage: successMessages[mode],
  };
}

// ─── Summary builder ──────────────────────────────────────────────────────────

function buildSummary(
  mode: FlowMode,
  answers: Record<string, string>,
  customInputs: Record<string, string>,
  t: GuestTranslations
): string {
  const pick = (key: string) => customInputs[key]?.trim() || answers[key] || "";

  if (mode === "food") {
    const parts: string[] = [];
    const item = pick("item");
    if (item) parts.push(item);
    const qty = pick("quantity");
    if (qty && qty !== "1") parts.push(`× ${qty}`);
    const note = pick("note");
    if (note) parts.push(`— ${note}`);
    return `${t.flowFoodLabel}: ${parts.join(" ")}`;
  }

  if (mode === "support") {
    const parts: string[] = [];
    const issueValue = pick("issueType");
    // Find label for the semantic value — fall back to raw value for custom text
    const issueLabel = issueValue;
    if (issueLabel) parts.push(issueLabel);
    const urgencyValue = pick("urgency");
    const urgencyLabel = urgencyValue;
    if (urgencyLabel) parts.push(`(${urgencyLabel})`);
    const note = pick("note");
    if (note) parts.push(`— ${note}`);
    return `${t.flowSupportLabel}: ${parts.join(" ")}`;
  }

  if (mode === "care") {
    const free = pick("freetext");
    const parts: string[] = [];
    if (free) parts.push(free);
    const sleep = pick("sleep");
    if (sleep && sleep !== "NORMAL") parts.push(`${t.flowSumSleep}: ${sleep}`);
    const diet = pick("diet");
    if (diet && diet !== "NORMAL") parts.push(`${t.flowSumDiet}: ${diet}`);
    const comfort = pick("comfort");
    if (comfort && comfort !== "STANDARD") parts.push(`${t.flowSumComfort}: ${comfort}`);
    const service = pick("service");
    if (service) parts.push(`${t.flowSumService}: ${service}`);
    return parts.length > 0 ? parts.join(", ") : t.flowCareLabel;
  }

  return "Service request";
}

function buildStructuredData(
  mode: FlowMode,
  answers: Record<string, string>,
  customInputs: Record<string, string>
) {
  const pick = (key: string) => customInputs[key]?.trim() || answers[key] || null;

  const base = { originalLanguage: navigator.language };

  if (mode === "food") {
    return {
      ...base,
      category: pick("category"),
      item: pick("item"),
      quantity: parseInt(pick("quantity") ?? "1", 10),
      note: pick("note"),
    };
  }
  if (mode === "support") {
    return {
      ...base,
      issueTypeKey: answers["issueType"] ?? null,
      issueTypeCustom: customInputs["issueType"] ?? null,
      urgencyKey: answers["urgency"] ?? null,
      note: pick("note"),
    };
  }
  if (mode === "care") {
    return {
      ...base,
      freetext: pick("freetext"),
      sleepKey: answers["sleep"] ?? null,
      dietKey: answers["diet"] ?? null,
      comfortKey: answers["comfort"] ?? null,
      serviceKey: answers["service"] ?? null,
    };
  }
  return { ...base, ...answers, ...customInputs };
}

// ─── Option Button ─────────────────────────────────────────────────────────────

function OptionButton({
  option,
  selected,
  dimmed,
  onSelect,
}: {
  option: StepOption;
  selected: boolean;
  dimmed?: boolean;
  onSelect: (value: string) => void;
}) {
  const IconComp = option.icon;
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] touch-manipulation ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
          : dimmed
          ? "border-zinc-100 bg-zinc-50/50 text-zinc-400"
          : "border-zinc-100 bg-white text-zinc-900 hover:border-zinc-200 shadow-sm"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          selected ? "bg-white/15" : dimmed ? "bg-zinc-100" : "bg-zinc-50"
        }`}
      >
        <IconComp
          className={`w-4 h-4 ${
            selected ? "text-white" : dimmed ? "text-zinc-300" : "text-zinc-500"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-[15px] font-semibold leading-tight ${
            selected ? "text-white" : dimmed ? "text-zinc-400" : "text-zinc-900"
          }`}
        >
          {option.label}
        </p>
        {option.subtitle && (
          <p
            className={`text-[12px] mt-0.5 leading-tight ${
              selected ? "text-zinc-300" : dimmed ? "text-zinc-300" : "text-zinc-400"
            }`}
          >
            {option.subtitle}
          </p>
        )}
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          selected ? "border-white bg-white" : "border-zinc-200"
        }`}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />}
      </div>
    </button>
  );
}

// ─── Custom Input Area ─────────────────────────────────────────────────────────

function CustomInputArea({
  value,
  onChange,
  placeholder,
  rows = 2,
  prominent = false,
  activeLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  prominent?: boolean;
  activeLabel?: string;
}) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        value.trim()
          ? "border-zinc-900 bg-white shadow-md"
          : "border-zinc-100 bg-white"
      } ${prominent ? "p-4" : "p-3"}`}
    >
      <div className="flex items-start gap-2.5">
        <PenLine
          className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
            value.trim() ? "text-zinc-700" : "text-zinc-300"
          }`}
        />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={prominent ? 4 : rows}
          className="flex-1 bg-transparent text-[14px] text-zinc-900 placeholder:text-zinc-300 focus:outline-none resize-none leading-relaxed"
        />
      </div>
      {value.trim() && activeLabel && (
        <p className="text-[11px] text-zinc-500 font-medium mt-2 ml-7">{activeLabel}</p>
      )}
    </div>
  );
}

// ─── Confirm Card ──────────────────────────────────────────────────────────────

function ConfirmCard({
  mode,
  answers,
  customInputs,
  config,
  t,
  steps,
}: {
  mode: FlowMode;
  answers: Record<string, string>;
  customInputs: Record<string, string>;
  config: FlowConfig;
  t: GuestTranslations;
  steps: WizardStep[];
}) {
  const pick = (key: string) => customInputs[key]?.trim() || answers[key] || "";

  // Resolve display label for a semantic value in a given step
  function resolveLabel(stepId: string, value: string): string {
    if (!value) return "";
    // if it came from customInput, just return the raw text
    if (customInputs[stepId]?.trim()) return customInputs[stepId].trim();
    const step = steps.find((s) => s.id === stepId);
    const opt = step?.options?.find((o) => o.value === value);
    return opt?.label ?? value;
  }

  const entries: { label: string; value: string }[] = [];

  if (mode === "food") {
    const item = pick("item");
    if (item) entries.push({ label: t.flowSumFood, value: item });
    const qty = pick("quantity");
    if (qty) entries.push({ label: t.flowSumPortions, value: qty });
    const note = pick("note");
    if (note) entries.push({ label: t.flowSumKitchenNote, value: note });
  } else if (mode === "support") {
    const issue = resolveLabel("issueType", pick("issueType"));
    if (issue) entries.push({ label: t.flowSumTopic, value: issue });
    const urgency = resolveLabel("urgency", pick("urgency"));
    if (urgency) entries.push({ label: t.flowSumPriority, value: urgency });
    const note = pick("note");
    if (note) entries.push({ label: t.flowSumDetail, value: note });
  } else if (mode === "care") {
    const free = pick("freetext");
    if (free) entries.push({ label: t.flowSumNote, value: free });
    const sleep = resolveLabel("sleep", pick("sleep"));
    if (sleep) entries.push({ label: t.flowSumSleep, value: sleep });
    const diet = resolveLabel("diet", pick("diet"));
    if (diet) entries.push({ label: t.flowSumDiet, value: diet });
    const comfort = resolveLabel("comfort", pick("comfort"));
    if (comfort) entries.push({ label: t.flowSumComfort, value: comfort });
    const service = resolveLabel("service", pick("service"));
    if (service) entries.push({ label: t.flowSumService, value: service });
  }

  const IconComp = config.icon;

  return (
    <div className={`rounded-2xl border ${config.accentBorder} ${config.accentBg} p-5`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-xl ${config.accentIconBg} flex items-center justify-center`}>
          <IconComp className={`w-4 h-4 ${config.accentText}`} />
        </div>
        <p className={`text-[13px] font-bold uppercase tracking-wider ${config.accentText}`}>
          {config.label}
        </p>
      </div>
      <div className="space-y-3">
        {entries.length > 0 ? (
          entries.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <p className="text-[12px] text-zinc-400 font-medium w-28 shrink-0 pt-0.5">
                {label}
              </p>
              <p className="text-[14px] text-zinc-800 font-medium leading-snug">{value}</p>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-zinc-500">{config.label}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GuidedFlowPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get("mode");
  const mode: FlowMode =
    rawMode === "food" || rawMode === "support" || rawMode === "care"
      ? rawMode
      : "support";

  const config = buildFlowConfig(t, mode);
  const steps = config.steps;

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) setLocation("/");
    else if (user?.role !== "guest") setLocation("/manager");
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== "guest") return null;

  const currentStep: WizardStep = (() => {
    if (stepIndex >= steps.length) return steps[steps.length - 1];
    const step = steps[stepIndex];
    // Dynamically inject food items based on selected category
    if (step.id === "item" && mode === "food") {
      const category = answers.category ?? "breakfast";
      const raw = FOOD_MENU_RAW[category] ?? [];
      return {
        ...step,
        options: raw.map((item) => ({ ...item, label: item.value })),
      };
    }
    return step;
  })();

  const currentSelection = answers[currentStep.id] ?? "";
  const currentCustom = customInputs[currentStep.id] ?? "";

  const canAdvance: boolean = (() => {
    if (currentStep.type === "confirm") return true;
    if (currentStep.skippable) return true;
    if (currentStep.type === "text" || currentStep.careIntro)
      return currentCustom.trim().length > 0;
    if (currentStep.type === "select")
      return currentSelection.trim().length > 0 || currentCustom.trim().length > 0;
    return false;
  })();

  function setCustom(value: string) {
    setCustomInputs((prev) => ({ ...prev, [currentStep.id]: value }));
  }

  function handleSelectOption(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
    setCustomInputs((prev) => ({ ...prev, [currentStep.id]: "" }));
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  }

  function handleSkip() {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else setLocation("/guest");
  }

  function handleEditContinue() {
    setStepIndex(0);
  }

  async function handleConfirm() {
    setIsCreating(true);
    try {
      const summary = buildSummary(mode, answers, customInputs, t);
      const structuredData = buildStructuredData(mode, answers, customInputs);
      await createServiceRequest({
        requestType: config.requestType,
        summary,
        structuredData,
      });
      setIsComplete(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t.sendFailed;
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  const isConfirmStep = currentStep.type === "confirm";
  const isCareIntro = currentStep.careIntro === true;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (isComplete) {
    const IconComp = config.icon;
    return (
      <div className="min-h-[100dvh] bg-[#F8F8F8] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-500">
        <div
          className={`w-20 h-20 rounded-full ${config.accentBg} border-2 ${config.accentBorder} flex items-center justify-center mb-6`}
        >
          <CheckCircle2 className={`w-9 h-9 ${config.accentText}`} />
        </div>
        <div
          className={`w-12 h-12 rounded-2xl ${config.accentIconBg} flex items-center justify-center mb-4`}
        >
          <IconComp className={`w-6 h-6 ${config.accentText}`} />
        </div>
        <h1 className="text-[22px] font-serif text-zinc-900 mb-3 leading-snug">
          {t.flowRequestReceived}
        </h1>
        <p className="text-[15px] text-zinc-500 max-w-xs leading-relaxed mb-10">
          {config.successMessage}
        </p>
        <button
          onClick={() => setLocation("/guest")}
          className="bg-zinc-900 text-white rounded-2xl px-8 py-4 text-[15px] font-semibold shadow-md active:scale-95 transition-all"
        >
          {t.flowSuccessReturn}
        </button>
      </div>
    );
  }

  const IconComp = config.icon;

  return (
    <div className="min-h-[100dvh] bg-[#F8F8F8] flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-zinc-100 shrink-0 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 h-[60px] flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            <div className={`w-7 h-7 rounded-lg ${config.accentIconBg} flex items-center justify-center`}>
              <IconComp className={`w-3.5 h-3.5 ${config.accentText}`} />
            </div>
            <p className="text-[15px] font-semibold text-zinc-900">{config.label}</p>
          </div>
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.accentBg} ${config.accentText} ${config.accentBorder}`}
          >
            {stepIndex + 1} / {steps.length}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-zinc-100 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i < stepIndex
                  ? "bg-zinc-900 flex-1"
                  : i === stepIndex
                  ? "bg-zinc-600 flex-[2]"
                  : "flex-1"
              }`}
              style={i > stepIndex ? { backgroundColor: "#e4e4e7" } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div
          key={stepIndex}
          className="max-w-lg mx-auto px-4 pt-7 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-250"
        >
          {/* Question */}
          <div className="mb-5">
            <h2 className="text-[22px] font-serif text-zinc-900 leading-snug mb-1.5">
              {currentStep.question}
            </h2>
            {currentStep.subtitle && (
              <p className="text-[14px] text-zinc-400">{currentStep.subtitle}</p>
            )}
          </div>

          {/* ── Care intro: prominent free text ── */}
          {isCareIntro && (
            <div className="space-y-3">
              <CustomInputArea
                value={currentCustom}
                onChange={setCustom}
                placeholder={t.flowCareIntroPH}
                rows={5}
                prominent
                activeLabel={t.flowCustomPlaceholder}
              />
              <p className="text-[12px] text-zinc-400 text-center px-4">
                {t.flowCareNextHint}
              </p>
            </div>
          )}

          {/* ── Select step: options + always-visible custom input ── */}
          {!isCareIntro && currentStep.type === "select" && currentStep.options && (
            <div className="space-y-2.5">
              {currentStep.options.map((opt) => (
                <OptionButton
                  key={opt.value}
                  option={opt}
                  selected={currentSelection === opt.value}
                  dimmed={currentCustom.trim().length > 0 && currentSelection !== opt.value}
                  onSelect={handleSelectOption}
                />
              ))}

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-zinc-100" />
                <p className="text-[11px] text-zinc-300 font-medium shrink-0">{t.flowOrType}</p>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              <CustomInputArea
                value={currentCustom}
                onChange={setCustom}
                placeholder={t.flowCustomPlaceholder}
                activeLabel={t.flowCustomPlaceholder}
              />
            </div>
          )}

          {/* ── Plain text step ── */}
          {!isCareIntro && currentStep.type === "text" && (
            <textarea
              value={currentCustom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={t.flowTypeHere}
              rows={4}
              className="w-full bg-white border-2 border-zinc-100 rounded-2xl px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-300 resize-none shadow-sm transition-all"
            />
          )}

          {/* ── Confirm step ── */}
          {isConfirmStep && (
            <ConfirmCard
              mode={mode}
              answers={answers}
              customInputs={customInputs}
              config={config}
              t={t}
              steps={steps}
            />
          )}
        </div>
      </main>

      {/* Footer CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-zinc-100 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-2.5">
          {isConfirmStep ? (
            <>
              <button
                onClick={handleConfirm}
                disabled={isCreating}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[16px] font-semibold transition-all active:scale-[0.98] ${
                  config.accentBg
                } ${config.accentText} ${config.accentBorder} border shadow-sm disabled:opacity-60`}
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {t.flowConfirm}
              </button>
              <button
                onClick={handleEditContinue}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-100 transition-all active:scale-[0.98] hover:bg-zinc-100 disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" />
                {t.flowEditContinue}
              </button>
            </>
          ) : (
            <div className="flex gap-2.5">
              {currentStep.skippable && !canAdvance && (
                <button
                  onClick={handleSkip}
                  className="flex-1 py-4 rounded-2xl text-[15px] font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 transition-all active:scale-[0.98] hover:bg-zinc-100"
                >
                  {t.flowSkip}
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className={`flex-1 py-4 rounded-2xl text-[16px] font-semibold transition-all active:scale-[0.98] shadow-sm ${
                  canAdvance
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                }`}
              >
                {t.flowNext}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
