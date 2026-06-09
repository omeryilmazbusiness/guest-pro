/**
 * Parse Excel menu rows into CreateMenuItemInput objects.
 * Column headers are matched flexibly (TR/EN aliases).
 */

import * as XLSX from "xlsx";
import {
  MENU_CATEGORIES,
  MENU_TYPES,
  type CreateMenuItemInput,
  type MenuCategory,
  type MenuType,
} from "@/lib/restaurant";

const HEADER_ALIASES: Record<string, keyof CreateMenuItemInput | "currency"> = {
  name: "name",
  isim: "name",
  ürün: "name",
  urun: "name",
  item: "name",
  yemek: "name",
  dish: "name",
  title: "name",
  description: "description",
  açıklama: "description",
  aciklama: "description",
  desc: "description",
  category: "category",
  kategori: "category",
  cat: "category",
  menutype: "menuType",
  "menu type": "menuType",
  "menü tipi": "menuType",
  tip: "menuType",
  type: "menuType",
  availabledate: "availableDate",
  date: "availableDate",
  tarih: "availableDate",
  price: "priceAmount",
  fiyat: "priceAmount",
  priceamount: "priceAmount",
  amount: "priceAmount",
  currency: "currency",
  para: "currency",
  allergen: "allergenNotes",
  allergennotes: "allergenNotes",
  alerjen: "allergenNotes",
  portion: "portionInfo",
  portioninfo: "portionInfo",
  porsiyon: "portionInfo",
  sortorder: "sortOrder",
  order: "sortOrder",
  sıra: "sortOrder",
  sira: "sortOrder",
  active: "isActive",
  isactive: "isActive",
  aktif: "isActive",
};

const CATEGORY_ALIASES: Record<string, MenuCategory> = {
  breakfast: "BREAKFAST",
  kahvalti: "BREAKFAST",
  kahvaltı: "BREAKFAST",
  soup: "SOUP",
  corba: "SOUP",
  çorba: "SOUP",
  salad: "SALAD",
  salata: "SALAD",
  appetizer: "APPETIZER",
  baslangic: "APPETIZER",
  başlangıç: "APPETIZER",
  main: "MAIN_COURSE",
  main_course: "MAIN_COURSE",
  "main course": "MAIN_COURSE",
  ana: "MAIN_COURSE",
  "ana yemek": "MAIN_COURSE",
  dessert: "DESSERT",
  tatli: "DESSERT",
  tatlı: "DESSERT",
  beverage: "BEVERAGE",
  drink: "BEVERAGE",
  icecek: "BEVERAGE",
  içecek: "BEVERAGE",
  snack: "SNACK",
  atistirmalik: "SNACK",
  atıştırmalık: "SNACK",
  other: "OTHER",
  diger: "OTHER",
  diğer: "OTHER",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeKey(header: string): string {
  return header.replace(/\s+/g, "");
}

function resolveCategory(raw: unknown): MenuCategory {
  const key = normalizeHeader(raw).replace(/\s+/g, " ");
  if ((MENU_CATEGORIES as readonly string[]).includes(String(raw).trim().toUpperCase())) {
    return String(raw).trim().toUpperCase() as MenuCategory;
  }
  return CATEGORY_ALIASES[key] ?? CATEGORY_ALIASES[key.replace(/ /g, "_")] ?? "OTHER";
}

function resolveMenuType(raw: unknown): MenuType {
  const v = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (v === "ROOM_SERVICE" || v === "ROOMSERVICE" || v === "ODA") return "ROOM_SERVICE";
  if (v === "DAILY" || v === "GUNLUK" || v === "GÜNLÜK") return "DAILY";
  return "DAILY";
}

function parseBool(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  const v = String(raw ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "evet", "aktif", "active"].includes(v)) return true;
  if (["0", "false", "no", "hayir", "hayır", "pasif", "inactive"].includes(v)) return false;
  return true;
}

function parsePrice(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

function parseDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (parsed) {
      const y = parsed.y;
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
  if (m) {
    return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  }
  return null;
}

function mapRow(
  row: Record<string, unknown>,
  columnMap: Map<number, keyof CreateMenuItemInput | "currency">,
): CreateMenuItemInput | null {
  const draft: Partial<CreateMenuItemInput> & { currency?: string } = {
    menuType: "DAILY",
    category: "OTHER",
    isActive: true,
  };

  for (const [colIdx, field] of columnMap) {
    const raw = row[String(colIdx)];
    if (raw == null || raw === "") continue;

    switch (field) {
      case "name":
        draft.name = String(raw).trim();
        break;
      case "description":
        draft.description = String(raw).trim();
        break;
      case "category":
        draft.category = resolveCategory(raw);
        break;
      case "menuType":
        draft.menuType = resolveMenuType(raw);
        break;
      case "availableDate":
        draft.availableDate = parseDate(raw);
        break;
      case "priceAmount":
        draft.priceAmount = parsePrice(raw);
        break;
      case "currency":
        draft.currency = String(raw).trim().slice(0, 3).toUpperCase() || "TRY";
        break;
      case "allergenNotes":
        draft.allergenNotes = String(raw).trim();
        break;
      case "portionInfo":
        draft.portionInfo = String(raw).trim();
        break;
      case "sortOrder":
        draft.sortOrder = parseInt(String(raw), 10) || 0;
        break;
      case "isActive":
        draft.isActive = parseBool(raw);
        break;
    }
  }

  if (!draft.name) return null;

  if (draft.menuType === "DAILY" && !draft.availableDate) {
    draft.availableDate = new Date().toISOString().split("T")[0]!;
  }
  if (draft.menuType === "ROOM_SERVICE") {
    draft.availableDate = null;
  }

  return {
    name: draft.name,
    description: draft.description,
    category: draft.category ?? "OTHER",
    menuType: draft.menuType ?? "DAILY",
    availableDate: draft.availableDate ?? null,
    priceAmount: draft.priceAmount ?? null,
    currency: draft.currency ?? "TRY",
    isActive: draft.isActive ?? true,
    allergenNotes: draft.allergenNotes ?? null,
    portionInfo: draft.portionInfo ?? null,
    sortOrder: draft.sortOrder ?? 0,
  };
}

export interface MenuImportPreview {
  items: CreateMenuItemInput[];
  skipped: number;
  headers: string[];
}

export async function parseMenuExcelFile(file: File): Promise<MenuImportPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { items: [], skipped: 0, headers: [] };
  }

  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];

  if (rows.length < 2) {
    return { items: [], skipped: 0, headers: [] };
  }

  const headerRow = rows[0] ?? [];
  const columnMap = new Map<number, keyof CreateMenuItemInput | "currency">();
  const headers: string[] = [];

  headerRow.forEach((cell, idx) => {
    const label = String(cell ?? "").trim();
    headers.push(label);
    const norm = normalizeHeader(label);
    const key = HEADER_ALIASES[normalizeKey(norm)] ?? HEADER_ALIASES[norm];
    if (key) columnMap.set(idx, key);
  });

  if (![...columnMap.values()].includes("name")) {
    throw new Error("Excel must include a Name column (name, isim, ürün…)");
  }

  const items: CreateMenuItemInput[] = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const rowArr = rows[i] ?? [];
    const rowObj: Record<string, unknown> = {};
    rowArr.forEach((cell, idx) => {
      rowObj[String(idx)] = cell;
    });
    const mapped = mapRow(rowObj, columnMap);
    if (mapped) items.push(mapped);
    else skipped++;
  }

  return { items, skipped, headers };
}

export const MENU_IMPORT_TEMPLATE_HEADERS = [
  "name",
  "description",
  "category",
  "menuType",
  "availableDate",
  "priceAmount",
  "currency",
  "allergenNotes",
  "portionInfo",
  "sortOrder",
  "isActive",
];

export function downloadMenuImportTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    MENU_IMPORT_TEMPLATE_HEADERS,
    [
      "Margherita Pizza",
      "Fresh tomato & mozzarella",
      "MAIN_COURSE",
      "ROOM_SERVICE",
      "",
      "320.00",
      "TRY",
      "Contains gluten, dairy",
      "1 portion",
      "1",
      "true",
    ],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Menu");
  XLSX.writeFile(wb, "guest-pro-menu-template.xlsx");
}
