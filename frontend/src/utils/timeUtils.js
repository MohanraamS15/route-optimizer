/**
 * Convert seconds (from midnight) → "HH:MM" string for <input type="time">
 * e.g. 32400 → "09:00"
 */
export function secondsToTimeStr(seconds) {
  if (seconds === null || seconds === undefined || seconds === "") return "";
  const s = Number(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Convert "HH:MM" string → seconds from midnight
 * e.g. "09:00" → 32400
 */
export function timeStrToSeconds(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 3600 + m * 60;
}

/**
 * Format seconds for display as readable AM/PM string
 * e.g. 32400 → "9:00 AM"  |  61200 → "5:00 PM"
 */
export function secondsToDisplay(seconds) {
  if (seconds === null || seconds === undefined || seconds === "") return "—";
  const s = Number(seconds);
  let h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const period = h < 12 ? "AM" : "PM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}
