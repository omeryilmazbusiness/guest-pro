import { readFileSync, writeFileSync } from "fs";

const path = "src/lib/welcoming/hotel-content.ts";
let c = readFileSync(path, "utf8");

// ── 1. Extend WelcomingStrings interface ─────────────────────────────────────
const OLD_INTERFACE_END = `  placeTypeOther: string;\n}`;
const NEW_INTERFACE_END = `  placeTypeOther: string;
  /** Black card QR subtitle — cycling scroll text */
  registerQrLabel: string;
  /** Passport scan page instruction */
  scanInstruction: string;
  /** Passport scan page title */
  scanTitle: string;
  /** Result page — show to reception */
  showReception: string;
  /** Result page — wait message */
  waitMessage: string;
}`;

if (!c.includes(OLD_INTERFACE_END)) {
  console.error("FAIL: interface end not found"); process.exit(1);
}
c = c.replace(OLD_INTERFACE_END, NEW_INTERFACE_END);

// ── 2. Per-locale passport strings ──────────────────────────────────────────
const LOCALES = [
  {
    marker: `    placeTypeOther:      "Place",\n  },\n  tr:`,
    addition: `    registerQrLabel:     "Scan QR to register",\n    scanInstruction:     "Place your passport inside the frame",\n    scanTitle:           "Passport Scan",\n    showReception:       "Show this QR to reception",\n    waitMessage:         "Please wait while we check you in",`,
    next: "  tr:",
  },
  {
    marker: `    placeTypeOther:      "Yer",\n  },\n  ru:`,
    addition: `    registerQrLabel:     "Kayıt için QR kodu okut",\n    scanInstruction:     "Pasaportunuzu çerçeve içine yerleştirin",\n    scanTitle:           "Pasaport Tarama",\n    showReception:       "Bu QR kodu resepsiyona gösterin",\n    waitMessage:         "Giriş işleminiz yapılırken lütfen bekleyin",`,
    next: "  ru:",
  },
  {
    marker: `    placeTypeOther:      "Место",\n  },\n  hi:`,
    addition: `    registerQrLabel:     "Сканируйте QR для регистрации",\n    scanInstruction:     "Поместите паспорт в рамку",\n    scanTitle:           "Сканирование паспорта",\n    showReception:       "Покажите этот QR-код на ресепшн",\n    waitMessage:         "Пожалуйста, ожидайте регистрации",`,
    next: "  hi:",
  },
  {
    marker: `    placeTypeOther:      "\u0938\u094d\u0925\u093e\u0928",\n  },\n  ur:`,
    addition: `    registerQrLabel:     "\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u0947 \u0932\u093f\u090f QR \u0938\u094d\u0915\u0948\u0928 \u0915\u0930\u0947\u0902",\n    scanInstruction:     "\u0905\u092a\u0928\u093e \u092a\u093e\u0938\u092a\u094b\u0930\u094d\u091f \u092b\u094d\u0930\u0947\u092e \u0915\u0947 \u0905\u0902\u0926\u0930 \u0930\u0916\u0947\u0902",\n    scanTitle:           "\u092a\u093e\u0938\u092a\u094b\u0930\u094d\u091f \u0938\u094d\u0915\u0948\u0928",\n    showReception:       "\u092f\u0939 QR \u0915\u094b\u0921 \u0930\u093f\u0938\u0947\u092a\u094d\u0936\u0928 \u0915\u094b \u0926\u093f\u0916\u093e\u090f\u0902",\n    waitMessage:         "\u0915\u0943\u092a\u092f\u093e \u091a\u0947\u0915-\u0907\u0928 \u0915\u0947 \u0926\u094c\u0930\u093e\u0928 \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e \u0915\u0930\u0947\u0902",`,
    next: "  ur:",
  },
  {
    marker: `    placeTypeOther:      "\u062c\u06af\u06c1",\n  },\n  ja:`,
    addition: `    registerQrLabel:     "\u0631\u062c\u0633\u0679\u0631\u06cc\u0634\u0646 \u06a9\u06d2 \u0644\u06cc\u06d2 QR \u0627\u0633\u06a9\u06cc\u0646 \u06a9\u0631\u06cc\u06ba",\n    scanInstruction:     "\u0627\u067e\u0646\u0627 \u067e\u0627\u0633\u067e\u0648\u0631\u0679 \u0641\u0631\u06cc\u0645 \u06a9\u06d2 \u0627\u0646\u062f\u0631 \u0631\u06a9\u06be\u06cc\u06ba",\n    scanTitle:           "\u067e\u0627\u0633\u067e\u0648\u0631\u0679 \u0627\u0633\u06a9\u06cc\u0646",\n    showReception:       "\u06cc\u06c1 QR \u06a9\u0648\u0688 \u0631\u06cc\u0633\u067e\u0634\u0646 \u06a9\u0648 \u062f\u06a9\u06be\u0627\u0626\u06cc\u06ba",\n    waitMessage:         "\u0686\u06cc\u06a9 \u0627\u0646 \u06a9\u06d2 \u062f\u0648\u0631\u0627\u0646 \u0628\u0631\u0627\u0626\u06d2 \u06a9\u0631\u0645 \u0627\u0646\u062a\u0638\u0627\u0631 \u06a9\u0631\u06cc\u06ba",`,
    next: "  ja:",
  },
  {
    marker: `    placeTypeOther:      "\u5834\u6240",\n  },\n};`,
    addition: `    registerQrLabel:     "QR\u30b3\u30fc\u30c9\u3092\u30b9\u30ad\u30e3\u30f3\u3057\u3066\u767b\u9332",\n    scanInstruction:     "\u30d1\u30b9\u30dd\u30fc\u30c8\u3092\u30d5\u30ec\u30fc\u30e0\u5185\u306b\u7f6e\u3044\u3066\u304f\u3060\u3055\u3044",\n    scanTitle:           "\u30d1\u30b9\u30dd\u30fc\u30c8\u30b9\u30ad\u30e3\u30f3",\n    showReception:       "\u3053\u306eQR\u30b3\u30fc\u30c9\u3092\u30d5\u30ed\u30f3\u30c8\u306b\u898b\u305b\u3066\u304f\u3060\u3055\u3044",\n    waitMessage:         "\u30c1\u30a7\u30c3\u30af\u30a4\u30f3\u51e6\u7406\u4e2d\u3067\u3059\u3001\u304a\u5f85\u3061\u304f\u3060\u3055\u3044",`,
    next: "};",
  },
];

for (const { marker, addition, next } of LOCALES) {
  if (!c.includes(marker)) {
    console.error(`MISS: ${marker.slice(0, 60)}`);
    continue;
  }
  const replacement = marker.replace(
    `\n  },\n  ${next}`,
    `\n    ${addition}\n  },\n  ${next}`
  ).replace(
    `\n  },\n};`,
    `\n    ${addition}\n  },\n};`
  );
  // simpler: insert before the closing `},`
  const insertBefore = marker.includes(`\n  },\n};`) ? `\n  },\n};` : `\n  },\n  ${next}:`;
  const parts = c.split(marker);
  c = parts[0] + marker.replace(/(\n  },\n)/, `\n    ${addition}\n  },\n`) + parts.slice(1).join(marker);
  console.log(`OK: ${next}`);
}

writeFileSync(path, c, "utf8");
console.log("hotel-content.ts patched successfully.");
