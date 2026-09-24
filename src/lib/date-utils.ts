/**
 * Atom & Echo OS — Date & Time Management Engine (IST / Asia/Kolkata)
 *
 * Primary timezone: Asia/Kolkata (IST = UTC+05:30)
 * All operational dates, master calendar projections, 1-tap review slots,
 * billing anchor cycles, and LinkedIn publication folds follow IST.
 */

export const TIMEZONE_IST = "Asia/Kolkata";
export const LOCALE_IN = "en-IN";

/**
 * Returns the current date formatted as 'YYYY-MM-DD' in Asia/Kolkata timezone.
 * Safe across local browsers, Vercel edge functions, and UTC cloud servers.
 */
export function getTodayDateStringIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Converts any Date or ISO string to 'YYYY-MM-DD' in Asia/Kolkata.
 */
export function toDateStringIST(date: Date | string | number = new Date()): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return getTodayDateStringIST();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Extracts calendar parts (year, month 1-12, day 1-31, hour 0-23, minute 0-59) in IST.
 */
export function getISTDateParts(date: Date | string | number = new Date()): {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
} {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_IST,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(validDate);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  let hour = parseInt(partMap.hour || "0", 10);
  if (hour === 24) hour = 0;

  return {
    year: parseInt(partMap.year || "2026", 10),
    month: parseInt(partMap.month || "1", 10),
    day: parseInt(partMap.day || "1", 10),
    hour,
    minute: parseInt(partMap.minute || "0", 10),
    second: parseInt(partMap.second || "0", 10),
    weekday: partMap.weekday || "Mon",
  };
}

/**
 * Formats a date for human display in IST (e.g., "24 Sep 2026" or "Sep 24, 2026")
 */
export function formatDisplayDateIST(
  date: Date | string | number | null | undefined,
  options?:
    | { monthFormat?: "short" | "long" | "numeric"; showYear?: boolean }
    | Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (options && ("monthFormat" in options || "showYear" in options)) {
    const opt = options as { monthFormat?: "short" | "long" | "numeric"; showYear?: boolean };
    return new Intl.DateTimeFormat(LOCALE_IN, {
      timeZone: TIMEZONE_IST,
      month: opt.monthFormat || "short",
      day: "numeric",
      year: opt.showYear !== false ? "numeric" : undefined,
    }).format(d);
  }

  const intlOpts: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_IST,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(options as Intl.DateTimeFormatOptions),
  };

  return new Intl.DateTimeFormat(LOCALE_IN, intlOpts).format(d);
}

/**
 * Formats date and time in IST (e.g., "24 Sep, 10:00 AM IST")
 */
export function formatDisplayDateTimeIST(
  date: Date | string | number | null | undefined,
  optionsOrBadge?: boolean | Intl.DateTimeFormatOptions,
  includeBadge = false
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  if (typeof optionsOrBadge === "boolean") {
    const formatted = new Intl.DateTimeFormat(LOCALE_IN, {
      timeZone: TIMEZONE_IST,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
    return optionsOrBadge ? `${formatted} IST` : formatted;
  }

  const customOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE_IST,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(optionsOrBadge || {}),
  };

  const formatted = new Intl.DateTimeFormat(LOCALE_IN, customOptions).format(d);
  return includeBadge ? `${formatted} IST` : formatted;
}

/**
 * Formats time only in IST (e.g., "10:00 AM")
 */
export function formatDisplayTimeIST(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat(LOCALE_IN, {
    timeZone: TIMEZONE_IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Prepares value for `<input type="datetime-local">` in IST ('YYYY-MM-DDTHH:mm').
 * Crucial fix: Standard .toISOString().slice(0, 16) produces UTC time, which
 * creates a 5.5 hour discrepancy in Indian form fields.
 */
export function toDatetimeLocalIST(date: Date | string | number = new Date()): string {
  const parts = getISTDateParts(date);
  const YYYY = String(parts.year).padStart(4, "0");
  const MM = String(parts.month).padStart(2, "0");
  const DD = String(parts.day).padStart(2, "0");
  const HH = String(parts.hour).padStart(2, "0");
  const mm = String(parts.minute).padStart(2, "0");

  return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
}

/**
 * Parses an `<input type="datetime-local">` string ('YYYY-MM-DDTHH:mm') as IST,
 * and converts it into a canonical UTC ISO string for PostgreSQL storage.
 */
export function parseDatetimeLocalIST(datetimeLocalString: string): string {
  if (!datetimeLocalString) return new Date().toISOString();

  // If already full ISO with Z or offset, parse directly
  if (datetimeLocalString.includes("Z") || datetimeLocalString.includes("+")) {
    return new Date(datetimeLocalString).toISOString();
  }

  // Parse YYYY-MM-DDTHH:mm and treat as IST (+05:30)
  const [datePart, timePart] = datetimeLocalString.split("T");
  if (!datePart || !timePart) return new Date(datetimeLocalString).toISOString();

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // UTC = IST - 5 hours 30 minutes
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30, 0, 0));
  return utcDate.toISOString();
}

/**
 * Calculates optimal publishing slot for Indian Founder LinkedIn Audience:
 * - Default peak engagement slot: Next weekday at 10:00 AM IST (04:30 AM UTC).
 * - Avoids Saturdays and Sundays (moves to Monday 10:00 AM IST).
 * - If an existing future scheduled date is provided, it is preserved.
 */
export function calculateNextPublishSlotIST(existingDate?: string | null): string {
  if (existingDate) {
    const existing = new Date(existingDate);
    if (existing.getTime() > Date.now()) {
      return existing.toISOString();
    }
  }

  const nowParts = getISTDateParts();
  let targetYear = nowParts.year;
  let targetMonth = nowParts.month;
  let targetDay = nowParts.day;

  // If current IST time is before 09:30 AM and today is a weekday, target today at 10:00 AM IST
  const isWeekday = !["Sat", "Sun"].includes(nowParts.weekday);
  const isEarlyEnoughToday = isWeekday && (nowParts.hour < 9 || (nowParts.hour === 9 && nowParts.minute < 30));

  if (!isEarlyEnoughToday) {
    // Advance by 1 day
    const nextDay = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay + 1, 4, 30, 0, 0));
    const nextParts = getISTDateParts(nextDay);
    targetYear = nextParts.year;
    targetMonth = nextParts.month;
    targetDay = nextParts.day;

    // If Saturday, jump to Monday (+2 days)
    if (nextParts.weekday === "Sat") {
      targetDay += 2;
    } else if (nextParts.weekday === "Sun") {
      targetDay += 1;
    }
  }

  // 10:00 AM IST = 04:30 AM UTC
  const optimalSlotUtc = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, 4, 30, 0, 0));
  return optimalSlotUtc.toISOString();
}
