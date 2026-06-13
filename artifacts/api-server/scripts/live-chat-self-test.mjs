#!/usr/bin/env node
/**
 * Prod-ready self-test for guest ↔ reception live chat.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const guestRoot = path.resolve(apiRoot, "../guest-pro");
const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

function fail(name, error) {
  checks.push({ name, ok: false, error });
  console.error(`✗ ${name}: ${error}`);
}

function read(rel) {
  return readFileSync(path.join(apiRoot, rel), "utf8");
}

function readGuest(rel) {
  return readFileSync(path.join(guestRoot, rel), "utf8");
}

const unit = spawnSync(
  "pnpm",
  [
    "exec",
    "tsx",
    "--test",
    "src/lib/live-chat-welcome.unit.test.ts",
    "src/lib/live-chat-translate-lang.unit.test.ts",
  ],
  { cwd: apiRoot, stdio: "inherit" },
);
if (unit.status !== 0) process.exit(unit.status ?? 1);
pass("live-chat unit tests (welcome + translation)");

const migration = readFileSync(
  path.resolve(apiRoot, "../../lib/db/migrations/0021_live_chat.sql"),
  "utf8",
);
if (!migration.includes("live_chat_sessions") || !migration.includes("live_chat_messages")) {
  fail("migration", "0021_live_chat.sql incomplete");
} else {
  pass("DB migration 0021_live_chat");
}

const route = read("src/routes/live-chat.ts");
const translate = read("src/lib/live-chat-translate.ts");
const translateLang = read("src/lib/live-chat-translate-lang.ts");
const guestUnread = read("src/lib/live-chat-guest-unread.ts");
if (!route.includes("staff-messages") || !route.includes("staff-clear") || !route.includes('post("/live-chat/sessions/:id/clear"')) {
  fail("API routes", "missing staff-messages, staff-clear, or guest POST clear");
} else if (route.includes("void sinceId")) {
  fail("sync handler", "references undefined sinceId");
} else if (
  !route.includes("prepareGuestVisibleMessages") ||
  !route.includes("prepareStaffVisibleMessages") ||
  !route.includes("guestTyping")
) {
  fail("API routes", "missing bidirectional message localization");
} else if (
  !translate.includes("queueGuestMessageTranslation") ||
  !translateLang.includes("isGuestMessageReadyForStaff")
) {
  fail("translation", "auto-detect guest/staff translation missing");
} else if (
  !route.includes("/live-chat/guest-unread") ||
  !route.includes("/live-chat/guest-read") ||
  !guestUnread.includes("latestMessageId") ||
  !guestUnread.includes("markGuestStaffMessagesRead")
) {
  fail("guest unread", "missing guest-unread/guest-read routes or snapshot");
} else {
  pass("API routes with staff-messages + bidirectional AI translation + guest unread");
}

const guestPage = readGuest("src/pages/guest/live-chat.tsx");
if (!guestPage.includes("MicrophoneButton") || !guestPage.includes("clearLiveChatSession")) {
  fail("guest UI", "missing mic dictation or clear chat");
} else if (!guestPage.includes("uiLocale")) {
  fail("guest UI", "live chat must pass guest uiLocale for translation");
} else if (!guestPage.includes("isUrgentMode &&")) {
  fail("guest UI", "location/emergency buttons must be urgent-mode only");
} else {
  pass("guest live chat with uiLocale + urgent-only action buttons");
}

const guestHome = readGuest("src/pages/guest/home.tsx");
if (!guestHome.includes("triggerLiveChatEmergency")) {
  fail("guest home", "urgent tile must fire emergency before chat opens");
} else if (
  !guestHome.includes("receptionUnreadCount") ||
  !guestHome.includes("acknowledgeSeen")
) {
  fail("guest home", "reception unread badge must clear when guest opens chat");
} else {
  pass("guest home urgent instant emergency + unread ack on open");
}

const guestUnreadHook = readGuest("src/hooks/use-guest-live-chat-unread.ts");
const guestAlert = readGuest("src/lib/guest-live-chat-alert.ts");
const guestAlertUi = readGuest("src/components/guest/GuestLiveChatMessageAlert.tsx");
if (
  !guestUnreadHook.includes("shouldShowGuestLiveChatAlert") ||
  !guestUnreadHook.includes("markGuestLiveChatRead") ||
  !guestAlert.includes("lastAckMessageId")
) {
  fail("guest unread UI", "missing alert dedupe or mark-read ack");
} else if (!guestAlertUi.includes("receptionLiveChatNewMessage")) {
  fail("guest unread UI", "missing reception message popup");
} else {
  pass("guest unread badge + one-time alert dedupe");
}

const receptionPopup = readGuest("src/components/manager/LiveChatPopup.tsx");
if (!receptionPopup.includes("useStaffLocale") || !receptionPopup.includes("fetchLiveChatMessages")) {
  fail("reception UI", "popup must fetch messages with staff locale");
} else if (!receptionPopup.includes("liveChatGuestTyping")) {
  fail("reception UI", "popup must show guest typing during translation");
} else {
  pass("reception popup passes staff locale + guest typing");
}

const receptionTab = readGuest("src/components/manager/LiveChatTab.tsx");
if (!receptionTab.includes("openChat")) {
  fail("reception UI", "missing inbox open chat");
} else {
  pass("reception live chat tab");
}

const scope = readGuest("src/lib/staff-scope.ts");
if (!scope.includes('"live_chat"')) {
  fail("staff scope", "live_chat tab missing");
} else {
  pass("reception live_chat tab in staff scope");
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
if (failed > 0) process.exit(1);
console.log("live-chat self-test OK");
