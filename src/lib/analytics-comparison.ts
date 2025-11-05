// Utility functions for analytics comparison calculations

export const calculatePercentChange = (current: number | null | undefined, previous: number | null | undefined): number => {
  if (!current || !previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const formatValue = (value: number | string, format?: 'number' | 'percentage' | 'currency' | 'time'): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `€${value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'time':
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    case 'number':
    default:
      return value.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  }
};

export const calculateChange = (current: number | null | undefined, previous: number | null | undefined) => {
  if (current == null || previous == null) return null;
  return {
    value: current - previous,
    percentage: calculatePercentChange(current, previous)
  };
};

export interface DailyTrend {
  date: string;
  leads_count: number;
  conversion_rate: number;
  avg_vsl_engagement: number;
  quiz_completion_rate: number;
}

export const extractTrendData = (dailyTrends: DailyTrend[], metricKey: keyof DailyTrend): number[] => {
  return dailyTrends.map(day => {
    const value = day[metricKey];
    return typeof value === 'number' ? value : 0;
  });
};
