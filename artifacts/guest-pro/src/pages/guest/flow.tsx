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
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowMode = "food" | "support" | "care";

interface StepOption {
  value: string;
  label: string;
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

// ─── Step definitions ─────────────────────────────────────────────────────────

const FOOD_MENU: Record<string, StepOption[]> = {
  breakfast: [
    { value: "Serpme Kahvaltı", label: "Serpme Kahvaltı", subtitle: "Peynir, zeytin, bal, reçel", icon: UtensilsCrossed },
    { value: "Omlet", label: "Omlet", subtitle: "Seçiminize göre iç malzeme", icon: Utensils },
    { value: "Avokado Tost", label: "Avokado Tost", subtitle: "Ekşi maya ekmek, haşlanmış yumurta", icon: Utensils },
    { value: "Taze Meyve Tabağı", label: "Taze Meyve Tabağı", subtitle: "Mevsim meyveleri", icon: Leaf },
  ],
  light: [
    { value: "Ekmeğe Yumurta", label: "Ekmeğe Yumurta", subtitle: "El yapımı ekmek", icon: Utensils },
    { value: "Peynirli Sandviç", label: "Peynirli Sandviç", subtitle: "Izgara peynirli sandviç", icon: Utensils },
    { value: "Günün Çorbası", label: "Günün Çorbası", subtitle: "Şefin günlük seçimi", icon: Utensils },
    { value: "Salata", label: "Salata", subtitle: "Tercih ettiğiniz sos ile", icon: Leaf },
  ],
  main: [
    { value: "Izgara Tavuk", label: "Izgara Tavuk", subtitle: "Mevsim sebzeli", icon: UtensilsCrossed },
    { value: "Şefin Makarnası", label: "Şefin Makarnası", subtitle: "Günlük özel makarna", icon: UtensilsCrossed },
    { value: "Tavada Balık", label: "Tavada Balık", subtitle: "Günün balığı", icon: UtensilsCrossed },
    { value: "Vejetaryen Tabak", label: "Vejetaryen Tabak", subtitle: "Mevsim sebze & tahıl", icon: Leaf },
  ],
  drinks: [
    { value: "Türk Çayı", label: "Türk Çayı", subtitle: "Demlik çay", icon: Coffee },
    { value: "Kahve", label: "Kahve", subtitle: "Türk kahvesi veya filtre", icon: Coffee },
    { value: "Taze Portakal Suyu", label: "Taze Portakal Suyu", subtitle: "Taze sıkılmış", icon: Coffee },
    { value: "Su / Maden Suyu", label: "Su / Maden Suyu", subtitle: "Sade veya köpüklü", icon: Coffee },
  ],
};

const CATEGORY_STEPS: StepOption[] = [
  { value: "breakfast", label: "Kahvaltı", subtitle: "Serpme, omlet, tost", icon: Sunrise },
  { value: "light", label: "Hafif Yemekler", subtitle: "Sandviç, çorba, salata", icon: Leaf },
  { value: "main", label: "Ana Yemekler", subtitle: "Tavuk, balık, makarna", icon: UtensilsCrossed },
  { value: "drinks", label: "İçecekler", subtitle: "Çay, kahve, meyve suyu", icon: Coffee },
];

const QUANTITY_OPTIONS: StepOption[] = [
  { value: "1", label: "1 porsiyon", icon: Utensils },
  { value: "2", label: "2 porsiyon", icon: Utensils },
  { value: "3", label: "3 porsiyon", icon: Utensils },
];

const FOOD_STEPS: WizardStep[] = [
  {
    id: "category",
    question: "Ne canınız çekiyor?",
    subtitle: "Bir kategori seçin",
    type: "select",
    options: CATEGORY_STEPS,
  },
  {
    id: "item",
    question: "Hangi yemeği istersiniz?",
    subtitle: "Bir ürün seçin",
    type: "select",
    options: [],
  },
  {
    id: "quantity",
    question: "Kaç porsiyon?",
    type: "select",
    options: QUANTITY_OPTIONS,
  },
  {
    id: "note",
    question: "Mutfağa notunuz var mı?",
    subtitle: "Opsiyonel — alerjiler, özel istek...",
    type: "text",
    skippable: true,
  },
  {
    id: "confirm",
    question: "Siparişinizi onaylayın",
    type: "confirm",
  },
];

const SUPPORT_STEPS: WizardStep[] = [
  {
    id: "issueType",
    question: "Nasıl yardımcı olalım?",
    subtitle: "Konuyu seçin",
    type: "select",
    options: [
      { value: "Minibar Tazele", label: "Minibar Tazele", subtitle: "İçecek ve atıştırmalık yenileme", icon: Wine },
      { value: "Odaya Yastık", label: "Odaya Yastık", subtitle: "Ekstra yastık getirin", icon: Moon },
      { value: "Oda Temizliği", label: "Oda Temizliği", subtitle: "Odam temizlensin", icon: Sparkles },
      { value: "Oda Sorunu", label: "Oda Sorunu", subtitle: "Klima, ısıtma, kapı vb.", icon: DoorOpen },
      { value: "Teknik Sorun", label: "Teknik Sorun", subtitle: "TV, wi-fi, elektrik", icon: Wifi },
      { value: "Gürültü Şikayeti", label: "Gürültü Şikayeti", subtitle: "Komşu oda, koridor", icon: Volume2 },
      { value: "Ekstra Malzeme", label: "Ekstra Malzeme", subtitle: "Havlu, sabun vb.", icon: Package },
      { value: "Diğer", label: "Diğer", subtitle: "Başka bir konuda", icon: MessageSquare },
    ],
  },
  {
    id: "urgency",
    question: "Bu ne kadar acil?",
    type: "select",
    options: [
      { value: "Acil", label: "Acil", subtitle: "Hemen ilgilenilmeli", icon: Bell },
      { value: "Normal", label: "Normal", subtitle: "Müsait olduğunuzda", icon: Utensils },
    ],
  },
  {
    id: "note",
    question: "Eklemek istediğiniz bir şey var mı?",
    subtitle: "Opsiyonel — detay veya özel bilgi",
    type: "text",
    skippable: true,
  },
  {
    id: "confirm",
    question: "Destek talebini onaylayın",
    type: "confirm",
  },
];

const CARE_STEPS: WizardStep[] = [
  {
    id: "freetext",
    question: "Tercihlerinizi paylaşın",
    subtitle: "Konaklamanızı sizin için kişiselleştirelim",
    type: "text",
    skippable: false,
    careIntro: true,
  },
  {
    id: "sleep",
    question: "Uyku düzeniniz nedir?",
    type: "select",
    skippable: true,
    options: [
      { value: "Erken yatarım", label: "Erken yatarım", subtitle: "22:00'dan önce", icon: Moon },
      { value: "Normal", label: "Normal", subtitle: "23:00 - 01:00 arası", icon: Moon },
      { value: "Geç yatarım", label: "Geç yatarım", subtitle: "01:00'dan sonra", icon: Moon },
    ],
  },
  {
    id: "diet",
    question: "Beslenme tercihiniz?",
    type: "select",
    skippable: true,
    options: [
      { value: "Normal", label: "Normal", subtitle: "Her şey", icon: UtensilsCrossed },
      { value: "Vejeteryan", label: "Vejeteryan", subtitle: "Et yok", icon: Leaf },
      { value: "Vegan", label: "Vegan", subtitle: "Hayvansal ürün yok", icon: Leaf },
      { value: "Gluten-free", label: "Gluten-free", subtitle: "Gluten içermez", icon: Leaf },
      { value: "Helal", label: "Helal", subtitle: "Helal gıda", icon: UtensilsCrossed },
    ],
  },
  {
    id: "comfort",
    question: "Konfor tercihiniz?",
    type: "select",
    skippable: true,
    options: [
      { value: "Standart", label: "Standart", subtitle: "Normal konfor ayarları", icon: Heart },
      { value: "Fazla yastık", label: "Fazla yastık", subtitle: "Ekstra yastık", icon: Moon },
      { value: "Fazla battaniye", label: "Fazla battaniye", subtitle: "Ekstra battaniye", icon: Moon },
      { value: "Serin oda", label: "Serin oda tercih ederim", subtitle: "Klimayı serin tutun", icon: Wind },
      { value: "Sıcak oda", label: "Sıcak oda tercih ederim", subtitle: "Isıtmayı yüksek tutun", icon: Wind },
    ],
  },
  {
    id: "service",
    question: "Hizmet stiliniz nedir?",
    type: "select",
    skippable: true,
    options: [
      { value: "Tam hizmet", label: "Tam hizmet", subtitle: "Sık kontrol, yardım hazır", icon: Bell },
      { value: "Minimal rahatsızlık", label: "Minimal rahatsızlık", subtitle: "Yalnız kalmak tercihim", icon: Bell },
    ],
  },
  {
    id: "confirm",
    question: "Tercihlerinizi onaylayın",
    type: "confirm",
  },
];

const FLOW_CONFIG: Record<
  FlowMode,
  {
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
> = {
  food: {
    steps: FOOD_STEPS,
    requestType: "FOOD_ORDER",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-700",
    accentIconBg: "bg-amber-100",
    label: "Oda Servisi",
    icon: UtensilsCrossed,
    successMessage: "Siparişiniz mutfağa iletildi. En kısa sürede hazırlanacak.",
  },
  support: {
    steps: SUPPORT_STEPS,
    requestType: "SUPPORT_REQUEST",
    accentBg: "bg-sky-50",
    accentBorder: "border-sky-200",
    accentText: "text-sky-700",
    accentIconBg: "bg-sky-100",
    label: "Destek Talebi",
    icon: Bell,
    successMessage: "Talebiniz personele iletildi. En kısa sürede ilgilenilecek.",
  },
  care: {
    steps: CARE_STEPS,
    requestType: "CARE_PROFILE_UPDATE",
    accentBg: "bg-rose-50",
    accentBorder: "border-rose-200",
    accentText: "text-rose-600",
    accentIconBg: "bg-rose-100",
    label: "Care About Me",
    icon: Heart,
    successMessage: "Tercihleriniz kaydedildi. Konaklamanızı kişiselleştireceğiz.",
  },
};

// ─── Summary builder ──────────────────────────────────────────────────────────

function buildSummary(
  mode: FlowMode,
  answers: Record<string, string>,
  customInputs: Record<string, string>
): string {
  const pick = (key: string) =>
    customInputs[key]?.trim() || answers[key] || "";

  if (mode === "food") {
    const parts: string[] = [];
    const item = pick("item");
    if (item) parts.push(item);
    const qty = pick("quantity");
    if (qty && qty !== "1") parts.push(`× ${qty}`);
    const note = pick("note");
    if (note) parts.push(`Not: ${note}`);
    return `Yemek siparişi: ${parts.join(" ")}`;
  }

  if (mode === "support") {
    const parts: string[] = [];
    const issue = pick("issueType");
    if (issue) parts.push(issue);
    const urgency = pick("urgency");
    if (urgency) parts.push(`(${urgency})`);
    const note = pick("note");
    if (note) parts.push(`— ${note}`);
    return `Destek talebi: ${parts.join(" ")}`;
  }

  if (mode === "care") {
    const free = pick("freetext");
    const parts: string[] = [];
    if (free) parts.push(free);
    const sleep = pick("sleep");
    if (sleep && sleep !== "Normal") parts.push(`Uyku: ${sleep}`);
    const diet = pick("diet");
    if (diet && diet !== "Normal") parts.push(`Diyet: ${diet}`);
    const comfort = pick("comfort");
    if (comfort && comfort !== "Standart") parts.push(`Konfor: ${comfort}`);
    const service = pick("service");
    if (service) parts.push(`Hizmet: ${service}`);
    return parts.length > 0
      ? `Misafir tercihleri: ${parts.join(", ")}`
      : "Misafir tercihleri kaydedildi";
  }

  return "Servis talebi";
}

function buildStructuredData(
  mode: FlowMode,
  answers: Record<string, string>,
  customInputs: Record<string, string>
) {
  const pick = (key: string) =>
    customInputs[key]?.trim() || answers[key] || null;

  if (mode === "food") {
    return {
      category: pick("category"),
      item: pick("item"),
      quantity: parseInt(pick("quantity") || "1", 10),
      note: pick("note"),
    };
  }
  if (mode === "support") {
    return {
      issueType: pick("issueType"),
      urgency: pick("urgency"),
      note: pick("note"),
    };
  }
  if (mode === "care") {
    return {
      freetext: pick("freetext"),
      sleep: pick("sleep"),
      diet: pick("diet"),
      comfort: pick("comfort"),
      service: pick("service"),
    };
  }
  return { ...answers, ...customInputs };
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  prominent?: boolean;
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
      {value.trim() && (
        <p className="text-[11px] text-zinc-500 font-medium mt-2 ml-7">
          Kendi isteğiniz kullanılacak
        </p>
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
}: {
  mode: FlowMode;
  answers: Record<string, string>;
  customInputs: Record<string, string>;
  config: (typeof FLOW_CONFIG)[FlowMode];
}) {
  const pick = (key: string) =>
    customInputs[key]?.trim() || answers[key] || "";

  const entries: { label: string; value: string }[] = [];

  if (mode === "food") {
    const item = pick("item");
    if (item) entries.push({ label: "Yemek", value: item });
    const qty = pick("quantity");
    if (qty) entries.push({ label: "Porsiyon", value: qty });
    const note = pick("note");
    if (note) entries.push({ label: "Mutfak notu", value: note });
  } else if (mode === "support") {
    const issue = pick("issueType");
    if (issue) entries.push({ label: "Konu", value: issue });
    const urgency = pick("urgency");
    if (urgency) entries.push({ label: "Öncelik", value: urgency });
    const note = pick("note");
    if (note) entries.push({ label: "Detay", value: note });
  } else if (mode === "care") {
    const free = pick("freetext");
    if (free) entries.push({ label: "Notunuz", value: free });
    const sleep = pick("sleep");
    if (sleep) entries.push({ label: "Uyku", value: sleep });
    const diet = pick("diet");
    if (diet) entries.push({ label: "Beslenme", value: diet });
    const comfort = pick("comfort");
    if (comfort) entries.push({ label: "Konfor", value: comfort });
    const service = pick("service");
    if (service) entries.push({ label: "Hizmet", value: service });
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
              <p className="text-[12px] text-zinc-400 font-medium w-24 shrink-0 pt-0.5">
                {label}
              </p>
              <p className="text-[14px] text-zinc-800 font-medium leading-snug">{value}</p>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-zinc-500">Tercihleriniz kaydedilecek.</p>
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

  const config = FLOW_CONFIG[mode];
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

  const steps = config.steps;

  const currentStep: WizardStep = (() => {
    if (stepIndex >= steps.length) return steps[steps.length - 1];
    const step = steps[stepIndex];
    if (step.id === "item" && mode === "food") {
      const category = answers.category ?? "breakfast";
      return { ...step, options: FOOD_MENU[category] ?? [] };
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
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  function handleSkip() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else {
      setLocation("/guest");
    }
  }

  function handleEditContinue() {
    setStepIndex(0);
  }

  async function handleConfirm() {
    setIsCreating(true);
    try {
      const summary = buildSummary(mode, answers, customInputs);
      const structuredData = buildStructuredData(mode, answers, customInputs);
      await createServiceRequest({
        requestType: config.requestType,
        summary,
        structuredData,
      });
      setIsComplete(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Bir hata oluştu. Lütfen tekrar deneyin.";
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
                  : "bg-zinc-150 flex-1"
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

          {/* ── Care intro: free text prominent, then options ── */}
          {isCareIntro && (
            <div className="space-y-3">
              <CustomInputArea
                value={currentCustom}
                onChange={setCustom}
                placeholder="Dikkat etmemizi istediklerinizi buraya yazın… (alerjiler, özel tercihler, kişisel notlar)"
                rows={5}
                prominent
              />
              <p className="text-[12px] text-zinc-400 text-center px-4">
                Aşağıdaki adımlarda tercihlerinizi hızlıca seçebilirsiniz.
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

              {/* Custom input divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-zinc-100" />
                <p className="text-[11px] text-zinc-300 font-medium shrink-0">veya kendiniz yazın</p>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              <CustomInputArea
                value={currentCustom}
                onChange={setCustom}
                placeholder={t.flowCustomPlaceholder}
              />
            </div>
          )}

          {/* ── Text step ── */}
          {!isCareIntro && currentStep.type === "text" && (
            <textarea
              value={currentCustom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Buraya yazın..."
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
