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
