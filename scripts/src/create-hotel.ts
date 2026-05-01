import "dotenv/config";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import { sql } from "drizzle-orm";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
  return "pbkdf2v3:" + salt + ":" + hash;
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ask(rl, question) {
  return (await rl.question(question)).trim();
}

async function askRequired(rl, question) {
  let answer = "";
  while (!answer) {
    answer = await ask(rl, question);
    if (!answer) console.log("  Bu alan zorunlu, bos birakilamaz.");
  }
  return answer;
}

async function main() {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) {
    console.error("DATABASE_URL tanimli degil.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool);
  const rl = readline.createInterface({ input, output });

  console.log("\n=== Guest Pro - Live DB Setup ===\n");

  console.log("--- HOTEL BILGILERI ---");
  const hotelName = await askRequired(rl, "Hotel adi: ");
  const suggestedSlug = slugify(hotelName);
  const slugInput = await ask(rl, "Hotel slug (Enter = " + suggestedSlug + "): ");
  const hotelSlug = slugInput || suggestedSlug;

  const existing = await db.execute(sql`SELECT id FROM hotels WHERE slug = ${hotelSlug} LIMIT 1`);
  if (existing.rows.length > 0) {
    console.error("HATA: " + hotelSlug + " slug zaten kullanımda.");
    await rl.close(); await pool.end(); process.exit(1);
  }

  console.log("\n--- MANAGER BILGILERI ---");
  const managerFirstName = await askRequired(rl, "Ad: ");
  const managerLastName  = await askRequired(rl, "Soyad: ");
  const managerEmail     = await askRequired(rl, "E-posta: ");
  const managerPassword  = await askRequired(rl, "Sifre: ");

  console.log("\n--- STAFF (bos birakılırsa atlanır) ---");
  const staffFirstName = await ask(rl, "Staff Adi (opsiyonel, Enter ile gec): ");
  let staffLastName = "", staffEmail = "", staffPassword = "", staffDept = "";
  if (staffFirstName) {
    staffLastName  = await askRequired(rl, "Soyad: ");
    staffEmail     = await askRequired(rl, "E-posta: ");
    staffPassword  = await askRequired(rl, "Sifre: ");
    staffDept      = await ask(rl, "Departman (reception, housekeeping vb.): ");
  }

  await rl.close();

  console.log("\n=== OZET ===");
  console.log("Hotel   : " + hotelName + " (slug: " + hotelSlug + ")");
  console.log("Manager : " + managerFirstName + " " + managerLastName + " <" + managerEmail + ">");
  if (staffFirstName) {
    console.log("Staff   : " + staffFirstName + " " + staffLastName + " <" + staffEmail + ">" + (staffDept ? " [" + staffDept + "]" : ""));
  }

  const confirmRl = readline.createInterface({ input, output });
  const confirm = await confirmRl.question("\nDevam edilsin mi? (evet / hayir): ");
  await confirmRl.close();

  if (confirm.trim().toLowerCase() !== "evet") {
    console.log("Iptal edildi."); await pool.end(); process.exit(0);
  }

  console.log("\nYaziliyor...");

  const hotelResult = await db.execute(
    sql`INSERT INTO hotels (name, slug, is_active) VALUES (${hotelName}, ${hotelSlug}, true) RETURNING id`
  );
  const hotelId = hotelResult.rows[0].id;
  console.log("Hotel olusturuldu -> id: " + hotelId);

  await db.execute(sql`INSERT INTO hotel_branding (hotel_id, app_name) VALUES (${hotelId}, ${hotelName})`);
  console.log("Hotel branding olusturuldu");

  const managerResult = await db.execute(
    sql`INSERT INTO users (hotel_id, email, password_hash, provider, role, first_name, last_name, is_active)
        VALUES (${hotelId}, ${managerEmail.toLowerCase().trim()}, ${hashPassword(managerPassword)},
                'local', 'manager', ${managerFirstName}, ${managerLastName}, true)
        RETURNING id`
  );
  console.log("Manager olusturuldu -> id: " + managerResult.rows[0].id);

  if (staffFirstName) {
    const staffResult = await db.execute(
      sql`INSERT INTO users (hotel_id, email, password_hash, provider, role, staff_department, first_name, last_name, is_active)
          VALUES (${hotelId}, ${staffEmail.toLowerCase().trim()}, ${hashPassword(staffPassword)},
                  'local', 'personnel', ${staffDept || null}, ${staffFirstName}, ${staffLastName}, true)
          RETURNING id`
    );
    console.log("Staff olusturuldu -> id: " + staffResult.rows[0].id);
  }

  console.log("\nTamamlandi! www.guest-pro.com uzerinden giris yapabilirsin.\n");
  await pool.end();
}

main().catch((err) => { console.error("Hata:", err.message); process.exit(1); });
