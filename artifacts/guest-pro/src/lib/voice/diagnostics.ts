/**
 * diagnostics.ts
 * Lightweight voice-flow diagnostic logger.
 *
 * Enabled automatically in dev (import.meta.env.DEV).
 * Safe to leave in production — silently no-ops when disabled.
 * All log entries are prefixed [VoiceDiag] for easy filtering.
 *
 * To follow the voice flow in browser devtools:
 *   Filter console by "[VoiceDiag]"
 */

const ENABLED = import.meta.env.DEV;

export const VoiceDiagnosticsLogger = {
  log(event: string, detail?: string): void {
    if (!ENABLED) return;
    const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    if (detail !== undefined) {
      console.log(`[VoiceDiag] ${ts} ${event} | ${detail}`);
    } else {
      console.log(`[VoiceDiag] ${ts} ${event}`);
    }
  },
};
