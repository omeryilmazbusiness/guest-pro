import sys, os
sys.stdout.reconfigure(encoding="utf-8")

BASE = os.path.dirname(os.path.abspath(__file__))
BAK  = os.path.join(BASE, "src/lib/welcoming/hotel-content.ts.bak")
OUT  = os.path.join(BASE, "src/lib/welcoming/hotel-content.ts")

c = open(BAK, encoding="utf-8").read()

# 1. Extend WelcomingStrings interface
old_end = "  placeTypeOther: string;\n}"
new_end = (
    "  placeTypeOther: string;\n"
    "  /** Black card QR subtitle \u2014 cycling scroll text */\n"
    "  registerQrLabel: string;\n"
    "  /** Passport scan page instruction */\n"
    "  scanInstruction: string;\n"
    "  /** Passport scan page title */\n"
    "  scanTitle: string;\n"
    "  /** Result page \u2014 show to reception */\n"
    "  showReception: string;\n"
    "  /** Result page \u2014 wait message */\n"
    "  waitMessage: string;\n"
    "}"
)
if old_end in c:
    c = c.replace(old_end, new_end, 1)
    print("OK: interface extended")
else:
    print("MISS: interface end not found")

# 2. Per-locale passport string inserts
LOCALES = [
    ("Place",
     "Scan QR to register",
     "Place your passport inside the frame",
     "Passport Scan",
     "Show this QR to reception",
     "Please wait while we check you in"),
    ("Yer",
     "Kay\u0131t i\u00e7in QR kodu okut",
     "Pasaportunuzu \u00e7er\u00e7eve i\u00e7ine yerle\u015ftirin",
     "Pasaport Tarama",
     "Bu QR kodu resepsiyona g\u00f6sterin",
     "Giri\u015f i\u015fleminiz yap\u0131l\u0131rken l\u00fctfen bekleyin"),
    ("\u041c\u0435\u0441\u0442\u043e",
     "\u0421\u043a\u0430\u043d\u0438\u0440\u0443\u0439\u0442\u0435 QR \u0434\u043b\u044f \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438",
     "\u041f\u043e\u043c\u0435\u0441\u0442\u0438\u0442\u0435 \u043f\u0430\u0441\u043f\u043e\u0440\u0442 \u0432 \u0440\u0430\u043c\u043a\u0443",
     "\u0421\u043a\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u0430\u0441\u043f\u043e\u0440\u0442\u0430",
     "\u041f\u043e\u043a\u0430\u0436\u0438\u0442\u0435 \u044d\u0442\u043e\u0442 QR-\u043a\u043e\u0434 \u043d\u0430 \u0440\u0435\u0441\u0435\u043f\u0448\u043d",
     "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u043e\u0436\u0438\u0434\u0430\u0439\u0442\u0435 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438"),
    ("\u0938\u094d\u0925\u093e\u0928",
     "\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u0947 \u0932\u093f\u090f QR \u0938\u094d\u0915\u0948\u0928 \u0915\u0930\u0947\u0902",
     "\u0905\u092a\u0928\u093e \u092a\u093e\u0938\u092a\u094b\u0930\u094d\u091f \u092b\u094d\u0930\u0947\u092e \u0915\u0947 \u0905\u0902\u0926\u0930 \u0930\u0916\u0947\u0902",
     "\u092a\u093e\u0938\u092a\u094b\u0930\u094d\u091f \u0938\u094d\u0915\u0948\u0928",
     "\u092f\u0939 QR \u0915\u094b\u0921 \u0930\u093f\u0938\u0947\u092a\u094d\u0936\u0928 \u0915\u094b \u0926\u093f\u0916\u093e\u090f\u0902",
     "\u0915\u0943\u092a\u092f\u093e \u091a\u0947\u0915-\u0907\u0928 \u0915\u0947 \u0926\u094c\u0930\u093e\u0928 \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e \u0915\u0930\u0947\u0902"),
    ("\u062c\u06af\u06c1",
     "\u0631\u062c\u0633\u0679\u0631\u06cc\u0634\u0646 \u06a9\u06d2 \u0644\u06cc\u06d2 QR \u0627\u0633\u06a9\u06cc\u0646 \u06a9\u0631\u06cc\u06ba",
     "\u0627\u067e\u0646\u0627 \u067e\u0627\u0633\u067e\u0648\u0631\u0679 \u0641\u0631\u06cc\u0645 \u06a9\u06d2 \u0627\u0646\u062f\u0631 \u0631\u06a9\u06be\u06cc\u06ba",
     "\u067e\u0627\u0633\u067e\u0648\u0631\u0679 \u0627\u0633\u06a9\u06cc\u0646",
     "\u06cc\u06c1 QR \u06a9\u0648\u0688 \u0631\u06cc\u0633\u067e\u0634\u0646 \u06a9\u0648 \u062f\u06a9\u06be\u0627\u0626\u06cc\u06ba",
     "\u0686\u06cc\u06a9 \u0627\u0646 \u06a9\u06d2 \u062f\u0648\u0631\u0627\u0646 \u0628\u0631\u0627\u0626\u06d2 \u06a9\u0631\u0645 \u0627\u0646\u062a\u0638\u0627\u0631 \u06a9\u0631\u06cc\u06ba"),
    ("\u5834\u6240",
     "QR\u30b3\u30fc\u30c9\u3092\u30b9\u30ad\u30e3\u30f3\u3057\u3066\u767b\u9332",
     "\u30d1\u30b9\u30dd\u30fc\u30c8\u3092\u30d5\u30ec\u30fc\u30e0\u5185\u306b\u7f6e\u3044\u3066\u304f\u3060\u3055\u3044",
     "\u30d1\u30b9\u30dd\u30fc\u30c8\u30b9\u30ad\u30e3\u30f3",
     "\u3053\u306eQR\u30b3\u30fc\u30c9\u3092\u30d5\u30ed\u30f3\u30c8\u306b\u898b\u305b\u3066\u304f\u3060\u3055\u3044",
     "\u30c1\u30a7\u30c3\u30af\u30a4\u30f3\u51e6\u7406\u4e2d\u3067\u3059\u3001\u304a\u5f85\u3061\u304f\u3060\u3055\u3044"),
]

ok = 0
for (plv, rql, sci, sct, shr, wm) in LOCALES:
    search = f'    placeTypeOther:       "{plv}",'
    if search in c:
        addition = (
            f'    registerQrLabel:     "{rql}",\n'
            f'    scanInstruction:     "{sci}",\n'
            f'    scanTitle:           "{sct}",\n'
            f'    showReception:       "{shr}",\n'
            f'    waitMessage:         "{wm}",'
        )
        c = c.replace(search, search + "\n" + addition, 1)
        ok += 1
        print(f"OK locale: {plv[:20]}")
    else:
        print(f"MISS: {repr(search[:60])}")

open(OUT, "w", encoding="utf-8").write(c)
print(f"\nDone: {ok}/6 locales patched.")
