import { readFileSync, writeFileSync } from "fs";

const FILE = new URL(
  "./src/lib/welcoming/hotel-content.ts",
  import.meta.url
).pathname;

let c = readFileSync(FILE, "utf8");

const INSERTS = [
  {
    find: `    placeTypeOther:       "Place",`,
    add: [
      `    registerQrLabel:     "Scan QR to register",`,
      `    scanInstruction:     "Place your passport inside the frame",`,
      `    scanTitle:           "Passport Scan",`,
      `    showReception:       "Show this QR to reception",`,
      `    waitMessage:         "Please wait while we check you in",`,
    ],
  },
  {
    find: `    placeTypeOther:       "Yer",`,
    add: [
      `    registerQrLabel:     "Kay\u0131t i\u00e7in QR kodu okut",`,
      `    scanInstruction:     "Pasaportunuzu \u00e7er\u00e7eve i\u00e7ine yerle\u015ftirin",`,
      `    scanTitle:           "Pasaport Tarama",`,
      `    showReception:       "Bu QR kodu resepsiyona g\u00f6sterin",`,
      `    waitMessage:         "Giri\u015f i\u015fleminiz yap\u0131l\u0131rken l\u00fctfen bekleyin",`,
    ],
  },
  {
    find: `    placeTypeOther:       "\u041c\u0435\u0441\u0442\u043e",`,
    add: [
      `    registerQrLabel:     "\u0421\u043a\u0430\u043d\u0438\u0440\u0443\u0439\u0442\u0435 QR \u0434\u043b\u044f \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438",`,
      `    scanInstruction:     "\u041f\u043e\u043c\u0435\u0441\u0442\u0438\u0442\u0435 \u043f\u0430\u0441\u043f\u043e\u0440\u0442 \u0432 \u0440\u0430\u043c\u043a\u0443",`,
      `    scanTitle:           "\u0421\u043a\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0430\u0441\u043f\u043e\u0440\u0442\u0430",`,
      `    showReception:       "\u041f\u043e\u043a\u0430\u0436\u0438\u0442\u0435 \u044d\u0442\u043e\u0442 QR-\u043a\u043e\u0434 \u043d\u0430 \u0440\u0435\u0441\u0435\u043f\u0448\u043d",`,
      `    waitMessage:         "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u043e\u0436\u0438\u0434\u0430\u0439\u0442\u0435 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438",`,
    ],
  },
  {
    find: `    placeTypeOther:       "\u0938\u094d\u0925\u093e\u0928",`,
    add: [
      `    registerQrLabel:     "\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u0947 \u0932\u093f\u090f QR \u0938\u094d\u0915\u0948\u0928 \u0915\u0930\u0947\u0902",`,
      `    scanInstruction:     "\u0905\u092a\u0928\u093e \u092a\u093e\u0938\u092a\u094b\u0930\u094d\u091f \u092b\u094d\u0930\u0947\u092e \u0915\u0947 \u0905\u0902\u0926\u0930 \u0930\u0916\u0947\u0902",`,
      `    scanTitle:           "\u092a\u093e\u0938\u092a\u094b\u0930\u094d\u091f \u0938\u094d\u0915\u0948\u0928",`,
      `    showReception:       "\u092f\u0939 QR \u0915\u094b\u0921 \u0930\u093f\u0938\u0947\u092a\u094d\u0936\u0928 \u0915\u094b \u0926\u093f\u0916\u093e\u090f\u0902",`,
      `    waitMessage:         "\u0915\u0943\u092a\u092f\u093e \u091a\u0947\u0915-\u0907\u0928 \u0915\u0947 \u0926\u094c\u0930\u093e\u0928 \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e \u0915\u0930\u0947\u0902",`,
    ],
  },
  {
    find: `    placeTypeOther:       "\u062c\u06af\u06c1",`,
    add: [
      `    registerQrLabel:     "\u0631\u062c\u0633\u0679\u0631\u06cc\u0634\u0646 \u06a9\u06d2 \u0644\u06cc\u06d2 QR \u0627\u0633\u06a9\u06cc\u0646 \u06a9\u0631\u06cc\u06ba",`,
      `    scanInstruction:     "\u0627\u067e\u0646\u0627 \u067e\u0627\u0633\u067e\u0648\u0631\u0679 \u0641\u0631\u06cc\u0645 \u06a9\u06d2 \u0627\u0646\u062f\u0631 \u0631\u06a9\u06be\u06cc\u06ba",`,
      `    scanTitle:           "\u067e\u0627\u0633\u067e\u0648\u0631\u0679 \u0627\u0633\u06a9\u06cc\u0646",`,
      `    showReception:       "\u06cc\u06c1 QR \u06a9\u0648\u0688 \u0631\u06cc\u0633\u067e\u0634\u0646 \u06a9\u0648 \u062f\u06a9\u06be\u0627\u0626\u06cc\u06ba",`,
      `    waitMessage:         "\u0686\u06cc\u06a9 \u0627\u0646 \u06a9\u06d2 \u062f\u0648\u0631\u0627\u0646 \u0628\u0631\u0627\u0626\u06d2 \u06a9\u0631\u0645 \u0627\u0646\u062a\u0638\u0627\u0631 \u06a9\u0631\u06cc\u06ba",`,
    ],
  },
  {
    find: `    placeTypeOther:       "\u5834\u6240",`,
    add: [
      `    registerQrLabel:     "QR\u30b3\u30fc\u30c9\u3092\u30b9\u30ad\u30e3\u30f3\u3057\u3066\u767b\u9332",`,
      `    scanInstruction:     "\u30d1\u30b9\u30dd\u30fc\u30c8\u3092\u30d5\u30ec\u30fc\u30e0\u5185\u306b\u7f6e\u3044\u3066\u304f\u3060\u3055\u3044",`,
      `    scanTitle:           "\u30d1\u30b9\u30dd\u30fc\u30c8\u30b9\u30ad\u30e3\u30f3",`,
      `    showReception:       "\u3053\u306eQR\u30b3\u30fc\u30c9\u3092\u30d5\u30ed\u30f3\u30c8\u306b\u898b\u305b\u3066\u304f\u3060\u3055\u3044",`,
      `    waitMessage:         "\u30c1\u30a7\u30c3\u30af\u30a4\u30f3\u51e6\u7406\u4e2d\u3067\u3059\u3001\u304a\u5f85\u3061\u304f\u3060\u3055\u3044",`,
    ],
  },
];

let ok = 0;
for (const { find, add } of INSERTS) {
  if (c.includes(find)) {
    c = c.replace(find, find + "\n" + add.join("\n"));
    ok++;
    console.log("✓", find.slice(16, 50));
  } else {
    console.error("✗ MISS:", JSON.stringify(find.slice(0, 50)));
  }
}

writeFileSync(FILE, c, "utf8");
console.log(`\nDone: ${ok}/6 locales patched.`);
