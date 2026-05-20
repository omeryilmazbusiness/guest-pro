import type { MarketingTranslations } from "./types";

export const tr: MarketingTranslations = {
  nav: {
    why: "Neden",
    howItWorks: "Nasıl çalışır",
    product: "Ürün",
    forHotels: "Oteller için",
    demo: "Demo",
  },
  lang: {
    menuLabel: "Dil",
    en: "English",
    tr: "Türkçe",
    ar: "العربية",
    ku: "Kurdî",
  },
  header: {
    brand: "Guest Pro",
    requestDemo: "Demo talep et",
    signIn: "Giriş yap",
    menu: "Menü",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
  },
  hero: {
    badge: "Oteller ve tatil köyleri için yapay zeka konsiyerj",
    tagline:
      "her cebe beş yıldızlı dijital bir konsiyerj koyar — lobi QR'ından yerine getirilen talebe, saniyeler içinde.",
    taglineBrand: "Guest Pro",
    pillConcierge: "Yapay zeka konsiyerj asistanı",
    pillLanguages: "Yapay zeka ile her dil",
    pillTranslator: "Canlı yapay zeka çevirmeni",
    requestDemo: "Demo talep et",
    seeHowItWorks: "Nasıl çalıştığını gör",
    statConcierge: "Yapay zeka konsiyerj",
    statCountries: "Karşılanan misafirler",
    statTranslator: "Yapay zeka çevirmeni",
  },
  welcomePhrases: [
    { text: "Hoş geldiniz, değerli misafirimiz", dir: "ltr" },
    { text: "Günaydın, buyurun efendim", dir: "ltr" },
  ],
  countries: [
    "Türkiye",
    "Birleşik Arap Emirlikleri",
    "Suudi Arabistan",
    "Birleşik Krallık",
    "Amerika Birleşik Devletleri",
    "Almanya",
    "Fransa",
    "İspanya",
    "İtalya",
    "Japonya",
    "Çin",
    "Rusya",
    "Brezilya",
    "Hindistan",
    "Hollanda",
    "İsviçre",
    "Katar",
    "Mısır",
    "Yunanistan",
    "Portekiz",
    "Polonya",
    "İsveç",
    "Güney Kore",
    "Tayland",
    "Vietnam",
    "Endonezya",
  ],
  challenges: {
    label: "Zorluk",
    title: "Modern misafirler anında yanıt bekler. Çoğu otel hâlâ dağınık sistemlerle yönetilir.",
    intro:
      "Tek bir yapay zeka özelliği devreye girmeden önce, ekipler her gece aynı sıkıntıyı yaşar: çok fazla kanal, çok az netlik ve misafirlerin lobiden çıkışa kadar güvenebileceği hiçbir tutarlı deneyim yoktur.",
    items: [
      {
        title: "Resepsiyon yoğunluğu",
        description:
          "Misafirler yoğun check-in saatlerinde aynı soruları tekrar eder — Wi‑Fi, kahvaltı, geç çıkış — personel ise telefon ve walk-in'lerle boğuşur.",
      },
      {
        title: "Dil engeli",
        description:
          "Yabancı misafirler taleplerini ifade etmekte güçlük çeker; personel çeviri uygulamalarıyla idare etmeye çalışır ve yanlış yönlendirilen biletler kaçınılmaz hale gelir.",
      },
      {
        title: "Sohbet kargaşasında kaybolan talepler",
        description:
          "Kat hizmetleri ve oda servisi siparişleri WhatsApp konuşmalarında, yapışkan notlarda ve PMS yorumlarında kaybolur — hiçbir şey uçtan uca takip edilmez.",
      },
      {
        title: "Sessiz gecelerde belirsizlik",
        description:
          "Mesai dışı saatlerde misafirler geri aranmayı bekler; yöneticilerin oteldeki açık taleplere ilişkin canlı bir görünümü yoktur.",
      },
      {
        title: "Tutarsız marka deneyimi",
        description:
          "Her vardiya farklı yanıt verir. Premium tesisler, bir misafir lobiden ayrılır ayrılmaz beş yıldız hissini yitirir.",
      },
      {
        title: "Tek bir misafir yolculuğu yok",
        description:
          "QR menüler, kağıt formlar ve üçüncü taraf botlar konaklamayı parçalara böler — misafirler hiçbir zaman ceplerinde güvenilir tek bir konsiyerj bulamaz.",
      },
    ],
  },
  solution: {
    label: "Guest Pro'nun yanıtı",
    title: "İlk taramadan yerine getirilen talebe kadar tek bir premium konsiyerj katmanı",
    intro:
      "Guest Pro yeni bir gelen kutusu eklemez. Dağınık anları, tek bir otel markalı yolculukla değiştirir: her dilde karşılama, sesli veya yazılı talep ve ekiplerinizin zaten anladığı yapılandırılmış teslimat.",
    problemLabel: "Sorun",
    guestProLabel: "Guest Pro",
    beats: [
      {
        problem: "Misafirler check-in'den sonra nereden başlayacaklarını bilmez.",
        solution:
          "Tek bir markalı misafir anahtarı veya lobi QR'ı Guest Pro'yu anında açar — uygulama mağazası yok, hesap karmaşası yok.",
      },
      {
        problem: "Sesli ve yazılı talepler insan hızında, makine ölçeğinde karşılanmalıdır.",
        solution:
          "Gemini destekli konsiyerj otelinizi tanır, siparişleri doğal dilde alır ve saniyeler içinde onaylar.",
      },
      {
        problem: "Operasyon ekipleri yapı ister, daha fazla gelen kutusu gürültüsü değil.",
        solution:
          "Her talep, yöneticiler için canlı durum görünümüyle kat hizmetleri, F&B veya spaya yönlendirilen takip edilen bir bilete dönüşür.",
      },
    ],
  },
  howItWorks: {
    label: "Nasıl çalışır",
    title: "Misafirlerinizin hissettiği, yöneticilerinizin ölçebildiği bir deneyim",
    intro:
      "Her adım gerçek bir konaklama sorunuyla başlar, ardından Guest Pro'nun misafirlerden başka bir uygulama indirmelerini istemeden döngüyü nasıl kapattığını gösterir.",
    problemLabel: "Sorun",
    happensLabel: "Ne oluyor",
    items: [
      {
        title: "Gelir — konaklamanızı başlatın",
        problem: "Lobi kalabalık; misafirler tekrar sormaya çekinir.",
        narrative:
          "Odadaki veya kioskdaki QR'ı tarayın ya da kişisel misafir anahtarı bağlantısını açın. Guest Pro onları kendi dillerinde isimleriyle karşılar — isteğe bağlı pasaport doğrulamalı check-in.",
        outcome: "Sakin, markalı bir ana ekran broşürlerin ve belirsizliğin yerini alır.",
      },
      {
        title: "Sorar — yapay zeka konsiyerj dinler",
        problem: "Aramalar yanıtsız kalır; sohbet botları otelinizi tanımaz.",
        narrative:
          "Misafirler konuşur veya yazar: oda servisi, havlular, restoran saatleri, yerel tavsiyeler. Yapay zeka asistanı konsiyerj, canlı otel bilgilerini çeker, her iki yönde çeviri yapar ve talebi net biçimde onaylar.",
        outcome: "Her dil, her kanal — bir premium konuşma.",
      },
      {
        title: "Teslim eder — ekipler icra eder",
        problem: "Personel ihtiyaçları çok geç öğrenir; hiçbir şey önceliklendirilmez.",
        narrative:
          "Yapılandırılmış biletler doğru departmana düşer. Yöneticiler canlı operasyon ekranında SLA tarzı durumu izler — WhatsApp'ı karıştırmaya gerek kalmaz.",
        outcome: "Daha hızlı yerine getirme, daha mutlu yorumlar, daha az resepsiyon yangını.",
      },
    ],
  },
  features: {
    label: "Ürün",
    title: "Misafirlerin fark ettiği hizmetler. Ekibinizin güvendiği altyapı.",
    intro:
      "Yapay zeka asistanı konsiyerj, canlı çeviri ve yapılandırılmış operasyonlar — tek bir markalı konaklama deneyimi olarak paketlendi, araç yaması değil.",
    items: [
      {
        title: "Yapay zeka asistanı konsiyerj",
        description:
          "Politikalarınızı, menülerinizi, spa ve SSS'lerinizi bilen sesli ve yazılı sohbet — web sitenize yapıştırılmış genel bir bot değil.",
        highlight: "7/24 her odada",
      },
      {
        title: "Yapay zeka ile her dil",
        description:
          "Arayüz, ses ve yazılı yanıtlar misafirin diline uyum sağlar — Arapça ve Türkçe'den Japonca ve Portekizce'ye.",
        highlight: "100'den fazla dil",
      },
      {
        title: "Canlı yapay zeka çevirmeni",
        description:
          "Misafir ↔ personel anları için gerçek zamanlı tercümanlık — resepsiyon, kat hizmetleri ve restoran, konuşma kılavuzu olmadan.",
        highlight: "İki yönlü akıcılık",
      },
      {
        title: "Yapılandırılmış otel talepleri",
        description:
          "Kat hizmetleri, yeme-içme, olanaklar ve özel hızlı eylemler, yöneticilerinizin belirlediği önceliklerle otomatik olarak yönlendirilir.",
        highlight: "Uçtan uca takip",
      },
      {
        title: "Dünyayı karşılama",
        description:
          "Dönen misafir konumları, RTL uyumlu düzenler ve kültürel açıdan bilinçli metinler — uluslararası gruplar tanınmış hisseder, görmezden gelinmiş değil.",
        highlight: "Küresel hazır",
      },
      {
        title: "Konaklama operasyon merkezi",
        description:
          "Roller, konaklama politikaları, restoran akışları ve kapasite araçları tek bir platformda — oteller için tasarlandı, genel bilet sistemi değil.",
        highlight: "Tek panel",
      },
    ],
  },
  hotels: {
    label: "Oteller için",
    title: "3★ · 4★ · 5★ otelinizi galaksi seviyesine taşıyın",
    subtitle:
      "Guest Pro, konaklama sektörü için yapay zeka büyüme katmanıdır — yönetim, misafir satışları, çok dilli konsiyerj ve yerel keşif tek bir markalı platformda. Resepsiyonda daha az kaos. Gelir tablosunda daha fazla ek gelir.",
    tiers: ["3★ bağımsız", "4★ üst segment", "5★ lüks ve tatil köyleri"],
    bookDemo: "Otel demosu rezervasyonu yap",
    roiWalkthrough: "Yatırım getirisi incelemesini gör",
    roiLabel: "Modellenen etki",
    roiTitle: "120 odalı bir otelin tipik kazanımları — yüzde ve euro olarak",
    disclaimer:
      "Aşağıdaki modellenen ekonomi, sektör karşılaştırmalarını ve pilot tesis ortalamalarını kullanır (120 odalı profil, ~%75 doluluk, €145 ADR). Tesisinizin sonuçları mix, mevsimsellik ve aktivasyona bağlıdır — demo sırasında rakamları birlikte doğrularız.",
    pillars: [
      {
        title: "Gelir ve misafir satışları",
        description:
          "Yapay zeka, sohbette niyet görünür olduğunda geç çıkış, spa ve yeme-içme tekliflerini önerir — etik, marka uyumlu, ölçülebilir.",
      },
      {
        title: "Operasyon ve biletleme",
        description:
          "Her yastık, tepsi ve bakım işi takip edilir; hiçbir şey lobi defterinde kaybolmaz.",
      },
      {
        title: "Marka kalitesinde deneyim",
        description:
          "3★'dan 5★'a — aynı platform, sizin tipografiniz, sizin tonunuz, sizin upsell kurallarınız.",
      },
    ],
    storiesLabel: "Platformu satın",
    storiesTitle: "Alıcılarınızın toplantı odasında hatırladığı dört hikaye",
    roi: [
      {
        value: "38",
        suffix: "%",
        label: "Daha az resepsiyon yükü",
        detail:
          "Tekrarlayan Wi‑Fi, kahvaltı ve politika soruları yapay zeka sohbetine taşınır — personel yüksek değerli anlara odaklanır.",
        figure: "≈ aylık €2.4k yeniden konuşlandırılan iş gücü",
      },
      {
        value: "12",
        suffix: "%",
        label: "Daha yüksek ek gelir dönüşümü",
        detail:
          "Yeme-içme, spa ve geç çıkış için konaklama sırasındaki teklifler, misafirler 7/24 kendi dillerinde sorduğunda daha iyi dönüşüm sağlar.",
        figure: "+ aylık €4.8k upsell takibinde",
      },
      {
        value: "28",
        suffix: "%",
        label: "Daha az yanlış yönlendirilen talep",
        detail:
          "Çok dilli yapay zeka niyeti bir kez anlar — kat hizmetleri ve F&B biletleri ilk seferinde doğru kuyruğa düşer.",
        figure: "günde ortalama −41 dakika gecikme",
      },
      {
        value: "4.2",
        suffix: "×",
        label: "Daha hızlı dijital yanıt",
        detail:
          "Misafir mesajından onaylı bilete medyan süre ~8 dakikadan 90 saniyenin altına düşer.",
        figure: "GM'inizin canlı görebildiği operasyon SLA'sı",
      },
      {
        value: "+0.4",
        suffix: "★",
        label: "Yorum puanı artışı (modellenen)",
        detail:
          "Tutarlı dijital konsiyerj uygulayan tesisler, iki sezon içinde daha yüksek konaklama sonrası puanlar alır.",
        figure: "~%3–5 RevPAR hassasiyeti",
      },
      {
        value: "67",
        suffix: "%",
        label: "Misafirler self-servis yapay zekayı tercih eder",
        detail:
          "Uluslararası gezginler mobilde anında yanıt bekler — lobi bekleme müziğini dinlemek değil.",
        figure: "Sektör misafir tercihi ortalaması",
      },
    ],
    stories: [
      {
        tag: "Yapay Zeka Sohbet Konsiyerj",
        title: "En iyi resepsiyon personeliniz — asla uyumaz, her dili konuşur",
        hook: "Misafirler saat 02:00'de Arapça mesaj atar; kat hizmetleri mükemmel bir İngilizce biletle haberdar olur.",
        story: [
          "Konferans hafta sonunda tam kapasite düşünün. Telefon durmadan çalıyor: ekstra yastıklar, restoran saatleri, havalimanı transferi. Guest Pro'nun yapay zeka sohbeti tekrarlayan katmanı emer — otelinizin gerçek menülerine, politikalarına ve hizmetlerine dayalı, genel SSS değil.",
          "Bir talep insan müdahalesi gerektirdiğinde, konuşma tam bağlamla devredilir. Yöneticiler kategori bazında hacmi, yoğun saatleri ve çözüm sürelerini görür — bir sonraki ay kör değil, akıllıca kadrolama yaparsınız.",
        ],
        metrics: [
          { label: "Tek konuşmada işlenen dil sayısı", value: "100+" },
          { label: "Modellenen masa süresi tasarrufu", value: "38%" },
          { label: "Gece vardiyası kapsamı", value: "7/24" },
        ],
        outcome:
          "Satış hikayesi: güveni satın — her misafir duyulduğunu hisseder, her vardiya sakin kalır.",
      },
      {
        tag: "Çok Dilli Mod",
        title: "Dünyayı konuşan lobi — on farklı dil bilen personel olmadan",
        hook: "Arayüz, ses ve yapay zeka yanıtları, ilk QR taramasından itibaren misafirin diline uyar.",
        story: [
          "Bir Suudi aile, bir Japon iş insanı ve bir Polonyalı tur grubu aynı saatte check-in yapıyor. Çok dilli mod, metni, RTL düzenini ve yapay zeka yanıtlarını otomatik olarak çevirir — isteğe bağlı pasaport kaydı, her zaman saygı.",
          "Personel, uç durumlarda resepsiyonda veya mobil cihazda canlı yapay zeka çevirmenini kullanır. Spa saatleri veya alerjen notlarındaki yanlış iletişim, gelir kaybı olmaktan çıkar ve güven sinyaline dönüşür.",
        ],
        metrics: [
          { label: "Uluslararası misafir payı (tipik tatil köyü)", value: "%40–65" },
          { label: "Daha az yeniden açılan bilet", value: "28%" },
          { label: "Kaçınılan çeviri maliyeti", value: "aylık €1.1k" },
        ],
        outcome:
          "Satış hikayesi: 3★–5★'da premium karşılama — küresel marka hissi, küresel kadro olmadan.",
      },
      {
        tag: "Yakın Keşif",
        title: '"Burada ne var?" sorusunu komisyona dönüştürün',
        hook: "Küratörlü camiler, müzeler, eczaneler ve ortak restoranlar — harita, mesafe ve QR navigasyon ile.",
        story: [
          "Misafirler lobi broşürlerini okumaz; telefonlarında arar ve ekosisteminizden çıkarlar. Yakın Keşif, keşfi markanız içinde tutar: kategorize edilmiş mekanlar (yeme-içme, kültür, zorunlular), mesafeler ve yürüyüş yönleri için tek dokunuşla Google Maps veya QR.",
          "Ortak mekanları ve paketleri tanıtırsınız — yemek pişirme dersleri, çöl turları, helal restoranlar — takip edilebilir ilgiyle. GM, ulusal ve mevsimsel olarak hangi kategorilerin yükseldiğini görür; pazarlama talebin zaten olduğu yere harcar.",
        ],
        metrics: [
          { label: "Uygulama içi yerel görüntülemeler / konaklama", value: "PDF'e karşı 2.3×" },
          { label: "Ortak teklif tıklama oranı (modellenen)", value: "%14" },
          { label: "Ek gelir bağlantı oranı artışı", value: "+%12" },
        ],
        outcome:
          "Satış hikayesi: Yakın Keşif bir harita değil — kontrol ettiğiniz bir merchandising yüzeyidir.",
      },
      {
        tag: "Yapay Zeka Yönetim ve Gelir",
        title: "Operasyon, satış ve marj için tek panel — beş sekme değil",
        hook: "Canlı talepler, restoran akışları, kapasite ve misafir anahtarları tek bir konaklama odaklı merkez ekranda.",
        story: [
          "Nöbet yöneticiniz nelerin acil olduğunu anlamak için WhatsApp, PMS notları ve telsiz görüşmelerini bir araya getirmek zorunda kalmamalı. Guest Pro yapılandırılmış biletleri kat hizmetleri, F&B ve spaya yönlendirir — ekibinizin zaten anladığı SLA renkleriyle.",
          "Yapay zeka özetleri upsell fırsatlarını öne çıkarır: geç çıkış isteyen ancak teklif yapılmayan misafirler veya spayı iki kez soran ama rezervasyon yapmayan gruplar. Bu, platformun bedelini tek bir hafta sonunda karşılayan yönetim zekasıdır.",
        ],
        metrics: [
          { label: "Modellenen GM süresi tasarrufu / hafta", value: "6.5 saat" },
          { label: "Dijital olarak yakalanan upsell", value: "aylık €4.8k" },
          { label: "Talep izlenebilirliği", value: "%100" },
        ],
        outcome:
          "Satış hikayesi: kârı ve kontrolü satın — bağımsızdan zincire galaksi seviyesi operasyonlar.",
      },
    ],
  },
  demo: {
    label: "Otel grupları ve bağımsız tesisler için",
    title: "Guest Pro'yu otelinizde canlı bir demoda görün",
    intro:
      "Ekiplerinizin bugün yaşadığı sorunu inceleyin — ardından misafir check-in, yapay zeka konsiyerj, canlı çeviri, yönetici panosu ve restoran akışlarını tek bir hikayede görün.",
    requestDemo: "Demo talep et",
    guestSignIn: "Misafir girişi",
    dialogTitle: "Demo talep et",
    dialogDesc:
      "Guest Pro'yu canlı görün — tesisiniz için yapay zeka konsiyerj, misafir uygulaması ve personel panosu.",
    formName: "Adınız",
    formEmail: "İş e-postanız",
    formProperty: "Otel / tesis",
    formMessage: "Notlar (isteğe bağlı)",
    formSubmit: "E-posta ile gönder",
    formSending: "Gönderiliyor…",
    formNote: "E-posta uygulamanız açılır — bir iş günü içinde yanıtlarız.",
    formNamePh: "Ali Yılmaz",
    formEmailPh: "ali@oteliniz.com",
    formPropertyPh: "Grand Plaza Hotel",
    formMessagePh: "120 oda, şehir merkezi, yapay zeka konsiyerj + operasyon panosuyla ilgileniyor…",
    formError: "Lütfen ad, e-posta ve tesis bilgilerini doldurun.",
    formSuccess: "Demo talebini göndermek için e-posta uygulamanız açılıyor.",
  },
  footer: {
    kioskPrompt: "Zaten misafirimiz misiniz?",
    kioskLink: "Kiosk kaydını açın",
    copyright: "Modern konaklama için yapay zeka konsiyerj",
  },
};
