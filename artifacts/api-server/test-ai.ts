import "dotenv/config";
import { generateConciergeResponse } from "./src/lib/gemini";

async function run() {
  console.log("🤖 Gemini AI Test Başlıyor...");
  try {
    const result = await generateConciergeResponse(
      "Odamda internet çalışmıyor ve biraz acıktım. Neler yapabilirsiniz?",
      [],
      "Ömer"
    );
    console.log("\n✅ BAŞARILI! AI'dan gelen yanıt:\n");
    console.log(result.response);
    console.log("\n🏷  Tespit Edilen Kategori:", result.category);
  } catch (err) {
    console.error("\n❌ HATA:", err);
  }
}
run();
