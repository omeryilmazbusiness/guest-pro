/**
 * Translate restaurant menu item names/descriptions to Arabic and persist into
 * restaurant_menu_items.{name_i18n,description_i18n} under key "ar".
 *
 * Usage (prod):
 *   DATABASE_URL=... GEMINI_API_KEY=... pnpm exec tsx scripts/translate-menu-ar.ts
 *
 * Notes:
 * - Idempotent: skips items that already have name_i18n.ar.
 * - Safe: keeps original name/description unchanged; only adds i18n fields.
 */
import "dotenv/config";
import { db, restaurantMenuItemsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const MODELS = (process.env.GEMINI_TRANSLATE_MODELS ?? "gemini-2.5-flash-lite,gemini-2.5-flash,gemini-2.0-flash")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mustGetEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

async function translateToArabic(ai: GoogleGenAI, input: { name: string; description?: string | null }) {
  const name = normalizeWhitespace(input.name);
  const description = input.description ? normalizeWhitespace(input.description) : "";

  const prompt = [
    "Translate the following restaurant menu item to Modern Standard Arabic.",
    "Rules:",
    "- Return JSON only, with keys: name_ar, description_ar",
    "- Keep it short and natural for a hotel room-service menu",
    "- If description is empty, return description_ar as an empty string",
    "",
    `Name: ${name}`,
    `Description: ${description || "(empty)"}`,
  ].join("\n");

  let lastErr: unknown = null;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        const text = res.text ?? "";
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) throw new Error(`Unexpected model output: ${text}`);
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
          name_ar: string;
          description_ar: string;
        };

        return {
          nameAr: normalizeWhitespace(parsed.name_ar || name),
          descriptionAr: normalizeWhitespace(parsed.description_ar || ""),
        };
      } catch (e) {
        lastErr = e;
        // Backoff for transient capacity errors.
        await sleep(800 * (attempt + 1));
      }
    }
  }

  throw lastErr ?? new Error("Translation failed");
}

async function main() {
  mustGetEnv("DATABASE_URL");
  const apiKey = mustGetEnv("GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });

  // Translate active items for all hotels (safe default). Use HOTEL_ID to scope.
  const hotelId = process.env.HOTEL_ID ? Number(process.env.HOTEL_ID) : null;

  const where = [
    eq(restaurantMenuItemsTable.isActive, true),
    ...(hotelId ? [eq(restaurantMenuItemsTable.hotelId, hotelId)] : []),
  ];

  const rows = await db
    .select({
      id: restaurantMenuItemsTable.id,
      hotelId: restaurantMenuItemsTable.hotelId,
      name: restaurantMenuItemsTable.name,
      description: restaurantMenuItemsTable.description,
      hasArName: sql<boolean>`COALESCE((${restaurantMenuItemsTable.nameI18n} ->> 'ar') IS NOT NULL, false)`,
      hasArDesc: sql<boolean>`COALESCE((${restaurantMenuItemsTable.descriptionI18n} ->> 'ar') IS NOT NULL, false)`,
    })
    .from(restaurantMenuItemsTable)
    .where(and(...where))
    .orderBy(restaurantMenuItemsTable.id);

  const toTranslate = rows.filter((r) => !r.hasArName || (!r.hasArDesc && !!r.description?.trim()));

  console.log(`Active menu items: ${rows.length}`);
  console.log(`To translate (ar): ${toTranslate.length}`);

  for (const item of toTranslate) {
    console.log(`\n#${item.id} (hotel ${item.hotelId}) ${item.name}`);
    const tr = await translateToArabic(ai, { name: item.name, description: item.description });

    await db
      .update(restaurantMenuItemsTable)
      .set({
        nameI18n: sql`${restaurantMenuItemsTable.nameI18n} || jsonb_build_object('ar', ${tr.nameAr}::text)`,
        descriptionI18n: sql`${restaurantMenuItemsTable.descriptionI18n} || jsonb_build_object('ar', ${tr.descriptionAr}::text)`,
      })
      .where(eq(restaurantMenuItemsTable.id, item.id));

    console.log(`→ ar: ${tr.nameAr}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

