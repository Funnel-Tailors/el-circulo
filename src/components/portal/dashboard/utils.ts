// ============================================================================
// DELIVERY DASHBOARD — LOCAL UTILITIES
// El Círculo · Service Delivery Portal
// ============================================================================

/**
 * Format a major-unit monetary value (e.g. 1500.00) with currency symbol.
 * GHL sends monetaryValue already in major units — no /100 needed here.
 */
export function formatMajorMoney(value: number, currency: string): string {
  const formatted = value.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  return `${formatted} ${symbol}`;
}

/**
 * Returns a human-readable relative time string in Spanish.
 * e.g. "hace 2h", "hace 3d", "hace 1min"
 */
export function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (isNaN(diffMs) || diffMs < 0) return "ahora";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "hace un momento";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `hace ${diffD}d`;

  const diffM = Math.floor(diffD / 30);
  return `hace ${diffM}m`;
}

/**
 * Day label for an UPCOMING date (opposite of relativeTime, which is for the past).
 * Returns "HOY", "MAÑANA", or an abbreviated weekday + day, e.g. "JUE 12".
 */
export function upcomingDayLabel(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";

  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);

  if (diffDays <= 0) return "HOY";
  if (diffDays === 1) return "MAÑANA";

  const weekday = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
  return `${weekday} ${d.getDate()}`.toUpperCase();
}

/**
 * 24h time label for a date, e.g. "16:00".
 */
export function timeLabel(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * Calculates percentage delta between two numbers.
 * Returns null if prev is 0 (avoid division by zero).
 */
export function percentDelta(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null;
  return Math.round(((current - prev) / prev) * 100);
}

/**
 * Short-format large numbers. e.g. 12400 → "12.4k"
 */
export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
