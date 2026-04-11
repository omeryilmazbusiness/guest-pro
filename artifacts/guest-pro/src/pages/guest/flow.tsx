import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createServiceRequest, type ServiceRequestType } from "@/lib/service-requests";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type FlowMode = "food" | "support" | "care";

interface StepOption {
  value: string;
  label: string;
  emoji?: string;
  subtitle?: string;
}

interface WizardStep {
  id: string;
  question: string;
  subtitle?: string;
  type: "select" | "text" | "confirm";
  options?: StepOption[];
  skippable?: boolean;
  multiSelect?: boolean;
}

// ─── Step definitions ────────────────────────────────────────────────────────

const FOOD_MENU: Record<string, StepOption[]> = {
  breakfast: [
    { value: "Serpme Kahvaltı", label: "Serpme Kahvaltı", subtitle: "Peynir, zeytin, bal, reçel", emoji: "🍳" },
    { value: "Omlet", label: "Omlet", subtitle: "Seçiminize göre iç malzeme", emoji: "🥚" },
    { value: "Avokado Tost", label: "Avokado Tost", subtitle: "Ekşi maya ekmek, haşlanmış yumurta", emoji: "🥑" },
    { value: "Taze Meyve Tabağı", label: "Taze Meyve Tabağı", subtitle: "Mevsim meyveleri", emoji: "🍓" },
  ],
  light: [
    { value: "Ekmeğe Yumurta", label: "Ekmeğe Yumurta", subtitle: "El yapımı ekmek", emoji: "🍞" },
    { value: "Peynirli Sandviç", label: "Peynirli Sandviç", subtitle: "Izgara peynirli sandviç", emoji: "🧀" },
    { value: "Çorba", label: "Günün Çorbası", subtitle: "Şefin günlük seçimi", emoji: "🍵" },
    { value: "Salata", label: "Salata", subtitle: "Tercih ettiğiniz sos ile", emoji: "🥗" },
  ],
  main: [
    { value: "Izgara Tavuk", label: "Izgara Tavuk", subtitle: "Mevsim sebzeli", emoji: "🍗" },
    { value: "Pasta", label: "Şefin Pastası", subtitle: "Günlük özel makarna", emoji: "🍝" },
    { value: "Balık", label: "Tavada Balık", subtitle: "Günün balığı", emoji: "🐟" },
    { value: "Vejetaryen Tabak", label: "Vejetaryen Tabak", subtitle: "Mevsim sebze & tahıl", emoji: "🥦" },
  ],
  drinks: [
    { value: "Türk Çayı", label: "Türk Çayı", subtitle: "Demlik çay", emoji: "🫖" },
    { value: "Kahve", label: "Kahve", subtitle: "Türk kahvesi veya filtre", emoji: "☕" },
    { value: "Taze Portakal Suyu", label: "Taze Portakal Suyu", subtitle: "Taze sıkılmış", emoji: "🍊" },
    { value: "Su / Maden Suyu", label: "Su / Maden Suyu", subtitle: "Sade veya köpüklü", emoji: "💧" },
  ],
};

const CATEGORY_STEPS: StepOption[] = [
  { value: "breakfast", label: "Kahvaltı", emoji: "🍳", subtitle: "Serpme, omlet, tost" },
  { value: "light", label: "Hafif Yemekler", emoji: "🥗", subtitle: "Sandviç, çorba, salata" },
  { value: "main", label: "Ana Yemekler", emoji: "🍽️", subtitle: "Tavuk, balık, makarna" },
  { value: "drinks", label: "İçecekler", emoji: "☕", subtitle: "Çay, kahve, meyve suyu" },
];

const QUANTITY_OPTIONS: StepOption[] = [
  { value: "1", label: "1 porsiyon", emoji: "1️⃣" },
  { value: "2", label: "2 porsiyon", emoji: "2️⃣" },
  { value: "3", label: "3 porsiyon", emoji: "3️⃣" },
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
      { value: "Oda Sorunu", label: "Oda Sorunu", emoji: "🚪", subtitle: "Klima, ısıtma, kapı vb." },
      { value: "Temizlik & Çamaşır", label: "Temizlik & Çamaşır", emoji: "🧹", subtitle: "Oda temizliği, havlu değişimi" },
      { value: "Teknik Sorun", label: "Teknik Sorun", emoji: "📺", subtitle: "TV, wi-fi, elektrik" },
      { value: "Gürültü Şikayeti", label: "Gürültü Şikayeti", emoji: "🔇", subtitle: "Komşu oda, koridor" },
      { value: "Ekstra Malzeme", label: "Ekstra Malzeme", emoji: "🛁", subtitle: "Havlu, sabun, yastık vb." },
      { value: "Diğer", label: "Diğer", emoji: "💬", subtitle: "Başka bir konuda" },
    ],
  },
  {
    id: "urgency",
    question: "Bu ne kadar acil?",
    type: "select",
    options: [
      { value: "Acil", label: "Acil", emoji: "🚨", subtitle: "Hemen ilgilenilmeli" },
      { value: "Normal", label: "Normal", emoji: "🕐", subtitle: "Müsait olduğunuzda" },
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
    id: "sleep",
    question: "Uyku düzeniniz nedir?",
    type: "select",
    skippable: true,
    options: [
      { value: "Erken yatarım", label: "Erken yatarım", emoji: "🌙", subtitle: "22:00'dan önce" },
      { value: "Normal", label: "Normal", emoji: "⭐", subtitle: "23:00 - 01:00 arası" },
      { value: "Geç yatarım", label: "Geç yatarım", emoji: "🌃", subtitle: "01:00'dan sonra" },
    ],
  },
  {
    id: "diet",
    question: "Beslenme tercihiniz?",
    type: "select",
    skippable: true,
    options: [
      { value: "Normal", label: "Normal", emoji: "🍽️", subtitle: "Her şey" },
      { value: "Vejeteryan", label: "Vejeteryan", emoji: "🥦", subtitle: "Et yok" },
      { value: "Vegan", label: "Vegan", emoji: "🌱", subtitle: "Hayvansal ürün yok" },
      { value: "Gluten-free", label: "Gluten-free", emoji: "🌾", subtitle: "Gluten içermez" },
      { value: "Helal", label: "Helal", emoji: "✅", subtitle: "Helal gıda" },
    ],
  },
  {
    id: "comfort",
    question: "Konfor tercihiniz?",
    type: "select",
    skippable: true,
    options: [
      { value: "Normal", label: "Normal", emoji: "👍", subtitle: "Standart" },
      { value: "Fazla yastık", label: "Fazla yastık", emoji: "😴", subtitle: "Extra yastık" },
      { value: "Fazla battaniye", label: "Fazla battaniye", emoji: "🛏️", subtitle: "Extra battaniye" },
      { value: "Serin oda", label: "Serin oda tercih ederim", emoji: "❄️", subtitle: "Klimayı serin tutun" },
      { value: "Sıcak oda", label: "Sıcak oda tercih ederim", emoji: "🔥", subtitle: "Isıtmayı yüksek tutun" },
    ],
  },
  {
    id: "service",
    question: "Hizmet stiliniz nedir?",
    type: "select",
    skippable: true,
    options: [
      { value: "Tam hizmet", label: "Tam hizmet", emoji: "🛎️", subtitle: "Sık kontrol, yardım hazır" },
      { value: "Minimal rahatsızlık", label: "Minimal rahatsızlık", emoji: "🤫", subtitle: "Yalnız kalmak tercihim" },
    ],
  },
  {
    id: "note",
    question: "Başka bir notunuz var mı?",
    subtitle: "Opsiyonel — diğer tercih veya özel istek",
    type: "text",
    skippable: true,
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
    label: string;
    emoji: string;
    successMessage: string;
  }
> = {
  food: {
    steps: FOOD_STEPS,
    requestType: "FOOD_ORDER",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-700",
    label: "Oda Servisi",
    emoji: "🍽️",
    successMessage: "Siparişiniz mutfağa iletildi! En kısa sürede hazırlanacak.",
  },
  support: {
    steps: SUPPORT_STEPS,
    requestType: "SUPPORT_REQUEST",
    accentBg: "bg-yellow-50",
    accentBorder: "border-yellow-200",
    accentText: "text-yellow-700",
    label: "Destek Talebi",
    emoji: "🔔",
    successMessage: "Talebiniz personele iletildi. En kısa sürede ilgilenilecek.",
  },
  care: {
    steps: CARE_STEPS,
    requestType: "CARE_PROFILE_UPDATE",
    accentBg: "bg-rose-50",
    accentBorder: "border-rose-200",
    accentText: "text-rose-600",
    label: "Care About Me",
    emoji: "💝",
    successMessage: "Tercihleriniz kaydedildi. Konaklamanızı kişiselleştireceğiz.",
  },
};

// ─── Summary builder ──────────────────────────────────────────────────────────

function buildSummary(mode: FlowMode, answers: Record<string, string>): string {
  if (mode === "food") {
    const parts: string[] = [];
    if (answers.item) parts.push(answers.item);
    if (answers.quantity && answers.quantity !== "1") parts.push(`× ${answers.quantity}`);
    if (answers.note) parts.push(`Not: ${answers.note}`);
    return `Yemek siparişi: ${parts.join(" ")}`;
  }

  if (mode === "support") {
    const parts: string[] = [];
    if (answers.issueType) parts.push(answers.issueType);
    if (answers.urgency) parts.push(`(${answers.urgency})`);
    if (answers.note) parts.push(`— ${answers.note}`);
    return `Destek talebi: ${parts.join(" ")}`;
  }

  if (mode === "care") {
    const parts: string[] = [];
    if (answers.sleep && answers.sleep !== "Normal") parts.push(`Uyku: ${answers.sleep}`);
    if (answers.diet && answers.diet !== "Normal") parts.push(`Diyet: ${answers.diet}`);
    if (answers.comfort && answers.comfort !== "Normal") parts.push(`Konfor: ${answers.comfort}`);
    if (answers.service) parts.push(`Hizmet: ${answers.service}`);
    if (answers.note) parts.push(`Not: ${answers.note}`);
    return parts.length > 0
      ? `Misafir tercihleri: ${parts.join(", ")}`
      : "Misafir tercihleri kaydedildi";
  }

  return "Servis talebi";
}

function buildStructuredData(mode: FlowMode, answers: Record<string, string>) {
  if (mode === "food") {
    return {
      category: answers.category,
      item: answers.item,
      quantity: parseInt(answers.quantity || "1", 10),
      note: answers.note || null,
    };
  }
  if (mode === "support") {
    return {
      issueType: answers.issueType,
      urgency: answers.urgency,
      note: answers.note || null,
    };
  }
  if (mode === "care") {
    return {
      sleep: answers.sleep || null,
      diet: answers.diet || null,
      comfort: answers.comfort || null,
      service: answers.service || null,
      note: answers.note || null,
    };
  }
  return answers;
}

// ─── Option Button ────────────────────────────────────────────────────────────

function OptionButton({
  option,
  selected,
  onSelect,
}: {
  option: StepOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] touch-manipulation ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 shadow-sm"
      }`}
    >
      {option.emoji && (
        <span className="text-2xl shrink-0 leading-none">{option.emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold leading-tight ${selected ? "text-white" : "text-zinc-900"}`}>
          {option.label}
        </p>
        {option.subtitle && (
          <p className={`text-[12px] mt-0.5 leading-tight ${selected ? "text-zinc-300" : "text-zinc-400"}`}>
            {option.subtitle}
          </p>
        )}
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          selected
            ? "border-white bg-white"
            : "border-zinc-300"
        }`}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />}
      </div>
    </button>
  );
}

// ─── Confirmation Card ────────────────────────────────────────────────────────

function ConfirmCard({
  mode,
  answers,
  config,
}: {
  mode: FlowMode;
  answers: Record<string, string>;
  config: (typeof FLOW_CONFIG)[FlowMode];
}) {
  const entries: { label: string; value: string }[] = [];

  if (mode === "food") {
    if (answers.item) entries.push({ label: "Yemek", value: answers.item });
    if (answers.quantity) entries.push({ label: "Porsiyon", value: answers.quantity });
    if (answers.note) entries.push({ label: "Mutfak notu", value: answers.note });
  } else if (mode === "support") {
    if (answers.issueType) entries.push({ label: "Konu", value: answers.issueType });
    if (answers.urgency) entries.push({ label: "Öncelik", value: answers.urgency });
    if (answers.note) entries.push({ label: "Detay", value: answers.note });
  } else if (mode === "care") {
    if (answers.sleep) entries.push({ label: "Uyku", value: answers.sleep });
    if (answers.diet) entries.push({ label: "Beslenme", value: answers.diet });
    if (answers.comfort) entries.push({ label: "Konfor", value: answers.comfort });
    if (answers.service) entries.push({ label: "Hizmet", value: answers.service });
    if (answers.note) entries.push({ label: "Not", value: answers.note });
  }

  return (
    <div className={`rounded-2xl border ${config.accentBorder} ${config.accentBg} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{config.emoji}</span>
        <p className={`text-[13px] font-bold uppercase tracking-wider ${config.accentText}`}>
          {config.label}
        </p>
      </div>
      <div className="space-y-3">
        {entries.length > 0 ? (
          entries.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <p className="text-[12px] text-zinc-400 font-medium w-24 shrink-0 pt-0.5">{label}</p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GuidedFlowPage() {
  const { user, isAuthenticated } = useAuth();
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
  const [textInput, setTextInput] = useState("");
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

  const totalSelectSteps = steps.filter((s) => s.type !== "confirm").length;
  const progressStep = Math.min(stepIndex, totalSelectSteps);

  const currentAnswer = answers[currentStep.id] ?? "";
  const hasAnswer = currentAnswer.trim().length > 0;

  const canAdvance =
    currentStep.type === "select"
      ? hasAnswer
      : currentStep.type === "text"
      ? textInput.trim().length > 0 || !!currentStep.skippable
      : true;

  function handleSelectOption(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
  }

  function handleNext() {
    if (currentStep.type === "text") {
      if (textInput.trim()) {
        setAnswers((prev) => ({ ...prev, [currentStep.id]: textInput.trim() }));
      }
      setTextInput("");
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  function handleSkip() {
    setTextInput("");
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setTextInput(answers[steps[stepIndex - 1]?.id] ?? "");
    } else {
      setLocation("/guest");
    }
  }

  async function handleConfirm() {
    setIsCreating(true);
    try {
      const summary = buildSummary(mode, answers);
      const structuredData = buildStructuredData(mode, answers);
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

  if (isComplete) {
    return (
      <div className="min-h-[100dvh] bg-[#F8F8F8] flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-500">
        <div
          className={`w-20 h-20 rounded-full ${config.accentBg} border-2 ${config.accentBorder} flex items-center justify-center mb-6`}
        >
          <CheckCircle2 className={`w-9 h-9 ${config.accentText}`} />
        </div>
        <h1 className="text-[22px] font-serif text-zinc-900 mb-3 leading-snug">
          {config.emoji} Talebiniz Alındı
        </h1>
        <p className="text-[15px] text-zinc-500 max-w-xs leading-relaxed mb-10">
          {config.successMessage}
        </p>
        <button
          onClick={() => setLocation("/guest")}
          className="bg-zinc-900 text-white rounded-2xl px-8 py-4 text-[15px] font-semibold shadow-md active:scale-95 transition-all"
        >
          Ana sayfaya dön
        </button>
      </div>
    );
  }

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
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-zinc-900">{config.label}</p>
          </div>
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.accentBg} ${config.accentText} ${config.accentBorder}`}
          >
            {config.emoji} {stepIndex + 1} / {steps.length}
          </span>
        </div>
      </header>

      {/* Progress dots */}
      <div className="bg-white border-b border-zinc-100 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < stepIndex
                  ? "bg-zinc-900 flex-1"
                  : i === stepIndex
                  ? "bg-zinc-700 flex-[2]"
                  : "bg-zinc-200 flex-1"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-8 pb-32 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Question */}
          <div className="mb-6">
            <h2 className="text-[22px] font-serif text-zinc-900 leading-snug mb-1.5">
              {currentStep.question}
            </h2>
            {currentStep.subtitle && (
              <p className="text-[14px] text-zinc-400">{currentStep.subtitle}</p>
            )}
          </div>

          {/* Select step */}
          {currentStep.type === "select" && currentStep.options && (
            <div className="space-y-2.5">
              {currentStep.options.map((opt) => (
                <OptionButton
                  key={opt.value}
                  option={opt}
                  selected={currentAnswer === opt.value}
                  onSelect={handleSelectOption}
                />
              ))}
            </div>
          )}

          {/* Text step */}
          {currentStep.type === "text" && (
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Buraya yazın..."
              rows={4}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3.5 text-[15px] text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 resize-none shadow-sm"
            />
          )}

          {/* Confirm step */}
          {currentStep.type === "confirm" && (
            <ConfirmCard mode={mode} answers={answers} config={config} />
          )}
        </div>
      </main>

      {/* Bottom actions */}
      <div className="shrink-0 fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-zinc-100 z-20">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-2.5">
          {isConfirmStep ? (
            <>
              <button
                onClick={handleConfirm}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-2xl py-4 text-[16px] font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Onaylıyorum
                  </>
                )}
              </button>
              <button
                onClick={() => setStepIndex(0)}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 bg-zinc-50 text-zinc-600 border border-zinc-200 rounded-2xl py-3.5 text-[15px] font-medium active:scale-[0.98] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Düzenlemeye devam et
              </button>
            </>
          ) : (
            <div className="flex gap-2.5">
              {currentStep.skippable && currentStep.type === "text" && !textInput.trim() && (
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-zinc-50 text-zinc-500 border border-zinc-200 rounded-2xl py-3.5 text-[14px] font-medium active:scale-[0.98] transition-all"
                >
                  Atla
                </button>
              )}
              {currentStep.skippable && currentStep.type === "select" && (
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-zinc-50 text-zinc-500 border border-zinc-200 rounded-2xl py-3.5 text-[14px] font-medium active:scale-[0.98] transition-all"
                >
                  Atla
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold transition-all active:scale-[0.98] ${
                  currentStep.skippable ? "" : "w-full"
                } ${
                  canAdvance
                    ? "bg-zinc-900 text-white shadow-md flex-[2]"
                    : "bg-zinc-100 text-zinc-400 flex-[2] cursor-not-allowed"
                }`}
              >
                {stepIndex === steps.length - 2 ? "Onayla" : "İleri"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
