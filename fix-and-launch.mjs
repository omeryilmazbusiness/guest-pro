#!/usr/bin/env node
/**
 * GuestPro — Fix & Launch Script
 * Çalıştır: node fix-and-launch.mjs
 */
import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
const runSilent = (cmd, opts = {}) => {
  try { return execSync(cmd, { encoding: "utf8", cwd: ROOT, ...opts }); }
  catch { return ""; }
};

const GREEN  = "\x1b[32m";
const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const NC     = "\x1b[0m";
const step   = (n, t) => console.log(`\n${CYAN}[${n}]${NC} ${t}`);
const ok     = (t)    => console.log(`${GREEN}  ✅ ${t}${NC}`);
const warn   = (t)    => console.log(`${YELLOW}  ⚠️  ${t}${NC}`);
const fail   = (t)    => { console.log(`${RED}  ❌ ${t}${NC}`); process.exit(1); };

console.log(`\n${GREEN}${"=".repeat(50)}${NC}`);
console.log(`${GREEN}  GuestPro — Fix & Launch${NC}`);
console.log(`${GREEN}${"=".repeat(50)}${NC}`);

// ── 1. Araçları doğrula ───────────────────────────────────────────────────────
step("1/7", "Araçlar kontrol ediliyor...");
try { const v = runSilent("node --version").trim(); ok(`Node.js ${v}`); }
catch { fail("Node.js bulunamadı! https://nodejs.org"); }
try { const v = runSilent("pnpm --version").trim(); ok(`pnpm ${v}`); }
catch { warn("pnpm bulunamadı, kuruluyor..."); run("npm install -g pnpm@latest"); }
try { runSilent("brew --version"); ok("Homebrew mevcut"); }
catch { fail("Homebrew bulunamadı! https://brew.sh adresinden kurun."); }

// ── 2. .env dosyalarını yaz ───────────────────────────────────────────────────
step("2/7", ".env dosyaları yazılıyor...");
const envContent = `PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://guestpro:guestpro123@localhost:5432/guestpro
SESSION_SECRET=guestpro_dev_secret_change_in_production_32chars
GEMINI_API_KEY=AIzaSyABG_7KzDelo-iJ5MR52vu399Ki8FuibBQ
AI_INTEGRATIONS_GEMINI_API_KEY=AIzaSyABG_7KzDelo-iJ5MR52vu399Ki8FuibBQ
BASE_PATH=/
`;
writeFileSync(join(ROOT, ".env"), envContent);
writeFileSync(join(ROOT, "artifacts/api-server/.env"), envContent);
ok(".env ve artifacts/api-server/.env yazıldı");

// ── 3. PostgreSQL kur ve başlat ───────────────────────────────────────────────
step("3/7", "PostgreSQL kontrol ediliyor...");
let pgVersion = null;
for (const v of ["17", "16", "15", "14"]) {
  const installed = runSilent(`brew list postgresql@${v} 2>/dev/null`);
  if (installed.trim()) { pgVersion = v; break; }
}
if (!pgVersion) {
  console.log("  PostgreSQL@17 kuruluyor (bu biraz sürebilir)...");
  run("brew install postgresql@17");
  pgVersion = "17";
}
ok(`PostgreSQL@${pgVersion} mevcut`);

// PATH'e ekle
const pgBin = [
  `/opt/homebrew/opt/postgresql@${pgVersion}/bin`,
  `/usr/local/opt/postgresql@${pgVersion}/bin`,
].join(":");
process.env.PATH = `${pgBin}:${process.env.PATH}`;

// Başlat
try { run(`brew services start postgresql@${pgVersion}`); }
catch { warn("Servis başlatma uyarısı (devam ediliyor)"); }

// Hazır olmasını bekle
let pgReady = false;
for (let i = 1; i <= 8; i++) {
  const result = runSilent("pg_isready -q");
  if (result !== null && runSilent("pg_isready").includes("accepting")) { pgReady = true; break; }
  console.log(`  PostgreSQL bekleniyor (${i}/8)...`);
  execSync("sleep 2");
}
// pg_isready exit code 0 = ready
try {
  execSync("pg_isready", { stdio: "pipe" });
  pgReady = true;
} catch { /* not ready */ }

if (!pgReady) {
  // Son bir deneme
  try { execSync(`pg_isready -h localhost -p 5432`, { stdio: "pipe" }); pgReady = true; } catch {}
}
if (!pgReady) fail("PostgreSQL başlatılamadı! 'brew services list' ile kontrol edin.");
ok("PostgreSQL çalışıyor");

// ── 4. DB ve kullanıcı oluştur ────────────────────────────────────────────────
step("4/7", "Veritabanı hazırlanıyor...");
const psql = (sql) => runSilent(`psql postgres -c "${sql}" 2>/dev/null`);
psql("CREATE USER guestpro WITH PASSWORD 'guestpro123';") || warn("Kullanıcı zaten var");
psql("CREATE DATABASE guestpro OWNER guestpro;") || warn("DB zaten var");
psql("GRANT ALL PRIVILEGES ON DATABASE guestpro TO guestpro;");
psql("ALTER USER guestpro CREATEDB;");
// Bağlantı testi
try {
  execSync(`psql "postgresql://guestpro:guestpro123@localhost:5432/guestpro" -c "SELECT 1;" -q`, { stdio: "pipe" });
  ok("Veritabanı bağlantısı OK");
} catch {
  fail("DB bağlantısı başarısız! PostgreSQL çalışıyor mu? 'brew services list' çalıştırın.");
}

// ── 5. Temiz paket kurulumu ───────────────────────────────────────────────────
step("5/7", "Paketler kuruluyor (temiz kurulum)...");

// pnpm-lock.yaml sil (Replit Linux lockfile sorununu çözer)
const lockFile = join(ROOT, "pnpm-lock.yaml");
if (existsSync(lockFile)) { rmSync(lockFile); console.log("  Eski lockfile silindi"); }

// node_modules temizle
const dirsToClean = [
  ROOT,
  join(ROOT, "artifacts/api-server"),
  join(ROOT, "artifacts/guest-pro"),
  join(ROOT, "artifacts/mockup-sandbox"),
  join(ROOT, "lib/db"),
  join(ROOT, "lib/api-zod"),
  join(ROOT, "lib/api-spec"),
  join(ROOT, "lib/api-client-react"),
  join(ROOT, "lib/integrations-gemini-ai"),
];
for (const dir of dirsToClean) {
  const nm = join(dir, "node_modules");
  if (existsSync(nm)) { rmSync(nm, { recursive: true, force: true }); console.log(`  Temizlendi: ${nm.replace(ROOT, ".")}`); }
}
ok("node_modules temizlendi");

console.log("  pnpm install çalışıyor...");
run("pnpm install --no-frozen-lockfile");
ok("Paketler kuruldu");

// ── 6. DB şeması oluştur ──────────────────────────────────────────────────────
step("6/7", "Veritabanı şeması oluşturuluyor (Drizzle push)...");
// .env değerlerini process.env'e yükle
for (const line of envContent.split("\n")) {
  const [k, ...rest] = line.split("=");
  if (k && !k.startsWith("#")) process.env[k.trim()] = rest.join("=").trim();
}
try {
  run("pnpm --filter @workspace/db push");
  ok("DB şeması hazır");
} catch {
  warn("DB push başarısız. Manuel olarak çalıştırın: pnpm --filter @workspace/db push");
}

// ── 7. Uygulamayı başlat ─────────────────────────────────────────────────────
step("7/7", "Uygulama başlatılıyor...");
console.log(`
${GREEN}${"=".repeat(50)}${NC}
${GREEN}  🚀 GuestPro başlatılıyor!${NC}
${GREEN}${"=".repeat(50)}${NC}
  ${CYAN}API${NC}      → http://localhost:3000
  ${CYAN}Frontend${NC} → http://localhost:5173
  ${CYAN}Health${NC}   → http://localhost:3000/api/health
${GREEN}${"=".repeat(50)}${NC}
  Durdurmak için: Ctrl+C
${GREEN}${"=".repeat(50)}${NC}
`);

const dev = spawn("pnpm", ["dev"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env },
  shell: true,
});

dev.on("error", (err) => fail(`Uygulama başlatılamadı: ${err.message}`));
dev.on("close", (code) => {
  if (code !== 0 && code !== null) console.log(`\nUygulama ${code} koduyla çıktı.`);
});

process.on("SIGINT", () => { dev.kill("SIGINT"); process.exit(0); });
process.on("SIGTERM", () => { dev.kill("SIGTERM"); process.exit(0); });
