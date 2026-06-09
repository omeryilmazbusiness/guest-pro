/**
 * Derive a floor match key from a room number.
 * Examples: 301 → "3", 1205 → "12", G01 → "G", B2 → "B2"
 */
export function floorKeyFromRoomNumber(roomNumber: string): string | null {
  const raw = roomNumber.trim().toUpperCase();
  if (!raw) return null;

  if (/^(G|GROUND)/.test(raw)) return "G";
  const basement = raw.match(/^B(\d+)/);
  if (basement) return `B${basement[1]}`;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 1) return digits;
  if (digits.length === 2) return digits[0]!;
  if (digits.length === 3) return digits[0]!;
  const floor = digits.slice(0, -2).replace(/^0+/, "");
  return floor || digits[0]!;
}
