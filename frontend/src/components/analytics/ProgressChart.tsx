import { useMemo } from 'react';
import { Card } from '../common';

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function ProgressChart({
  data,
  title,
  color = '#6366F1',
  height = 200,
  valueFormatter = (v) => v.toString(),
}: ProgressChartProps) {
  const { maxValue, points, xLabels } = useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 100, points: '', xLabels: [] };
    }

    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const chartWidth = 100;
    const chartHeight = 100;

    const pointsArr = data.map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * chartWidth;
      const y = chartHeight - (d.value / max) * chartHeight;
      return `${x},${y}`;
    });

    // Create area path
    const areaPoints = [
      `0,${chartHeight}`,
      ...pointsArr,
      `${chartWidth},${chartHeight}`,
    ].join(' ');

    // Get x-axis labels (first, middle, last)
    const labels: string[] = [];
    if (data.length > 0) {
      labels.push(formatDate(data[0].date));
      if (data.length > 2) {
        labels.push(formatDate(data[Math.floor(data.length / 2)].date));
      }
      if (data.length > 1) {
        labels.push(formatDate(data[data.length - 1].date));
      }
    }

    return {
      maxValue: max,
      points: areaPoints,
      xLabels: labels,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div
          className="flex items-center justify-center text-gray-400"
          style={{ height: 150 }}
        >
          No data available
        </div>
      </Card>
    );
  }

  const latestValue = data[data.length - 1]?.value ?? 0;
  const previousValue = data[data.length - 2]?.value ?? latestValue;
  const change = latestValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  // Calculate data point positions as percentages for HTML overlay
  const dataPointPositions = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (d.value / maxValue) * 100,
  }));

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold" style={{ color }}>
              {valueFormatter(latestValue)}
            </span>
            {change !== 0 && (
              <span
                className={`text-sm font-medium ${
                  change > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change > 0 ? '+' : ''}
                {changePercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart container with relative positioning for circle overlay */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <g className="text-gray-200">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={(1 - ratio) * 100}
                x2="100"
                y2={(1 - ratio) * 100}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}
          </g>

          {/* Area fill */}
          <polygon
            points={points}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <polyline
            points={data
              .map((d, i) => {
                const x = (i / Math.max(data.length - 1, 1)) * 100;
                const y = 100 - (d.value / maxValue) * 100;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Data points as HTML elements (always circular) */}
        {dataPointPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-white border-2 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              borderColor: color,
            }}
          />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {xLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </Card>
  );
}

export default ProgressChart;
