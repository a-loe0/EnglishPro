import { Card } from '../common';

interface TrendCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  icon?: React.ReactNode;
  color?: string;
  valueFormatter?: (value: number | string) => string;
  trend?: 'up' | 'down' | 'neutral';
}

export function TrendCard({
  title,
  value,
  previousValue,
  icon,
  color = '#6366F1',
  valueFormatter = (v) => v.toString(),
  trend,
}: TrendCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const numericPrevious = previousValue ?? numericValue;

  const change = numericValue - numericPrevious;
  const changePercent = numericPrevious !== 0 ? (change / numericPrevious) * 100 : 0;

  const determinedTrend = trend ?? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');

  const getTrendColor = () => {
    switch (determinedTrend) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = () => {
    switch (determinedTrend) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
        )}
        {previousValue !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(changePercent).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold" style={{ color }}>
        {valueFormatter(value)}
      </div>

      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </Card>
  );
}

export default TrendCard;
