export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIsoDate(year: number, month1Based: number, day: number): string {
  return `${year}-${pad2(month1Based)}-${pad2(day)}`;
}

export function parseValueParts(
  raw: string,
  showTime: boolean
): {
  datePart: string; // YYYY-MM-DD
  hours: number; // 0-23
  minutes: number; // 0-59
} {
  const now = new Date();
  if (!raw) {
    return {
      datePart: "",
      hours: now.getHours(),
      minutes: now.getMinutes(),
    };
  }

  // Handle YYYY-MM-DDTHH:mm or ISO string
  if (raw.includes("T")) {
    const [dPart, tPart] = raw.split("T");
    const [hh, mm] = (tPart || "").split(":").map((v) => parseInt(v, 10));
    return {
      datePart: dPart || "",
      hours: !isNaN(hh) ? hh : now.getHours(),
      minutes: !isNaN(mm) ? mm : now.getMinutes(),
    };
  }

  return {
    datePart: raw.slice(0, 10),
    hours: showTime ? now.getHours() : 9,
    minutes: showTime ? now.getMinutes() : 0,
  };
}

export function formatTriggerLabel(
  raw: string,
  showTime: boolean,
  variant: "default" | "pill"
): string {
  if (!raw) return "";
  try {
    const { datePart, hours, minutes } = parseValueParts(raw, showTime);
    if (!datePart) return "";
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return raw;

    const d = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow =
      d.getFullYear() === tomorrow.getFullYear() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getDate() === tomorrow.getDate();

    const dateLabel =
      variant === "pill" && isToday
        ? "Today"
        : variant === "pill" && isYesterday
        ? "Yesterday"
        : variant === "pill" && isTomorrow
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(d.getFullYear() !== now.getFullYear() || variant === "default"
              ? { year: "numeric" }
              : {}),
          });

    if (!showTime) return dateLabel;

    const timeLabel = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${dateLabel}, ${timeLabel}`;
  } catch {
    return raw;
  }
}
