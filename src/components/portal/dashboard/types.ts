// ============================================================================
// DELIVERY DASHBOARD — SHARED TYPES
// El Círculo · Service Delivery Portal
// ============================================================================

export interface DashboardData {
  connected: boolean;
  cached?: boolean;
  metrics: {
    currency: string;
    leads: {
      total: number;
      last7: number;
      prev7: number;
      trend: { date: string; count: number }[];
    };
    opportunities: {
      count: number;
      open: number;
      won: number;
      pipeline_value: number;
      won_value: number;
      by_stage: { stage: string; count: number; value: number }[];
    };
    appointments: {
      total: number;
      upcoming: number;
      next?: { id: string; name: string; start: string; status?: string }[];
    } | null;
    activity: { name: string; when: string }[];
  } | null;
}

export type DashboardMetrics = NonNullable<DashboardData["metrics"]>;
