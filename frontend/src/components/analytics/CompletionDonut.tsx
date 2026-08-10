import { Card } from '../common';

interface CompletionDonutProps {
  completed: number;
  total: number;
  title: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export function CompletionDonut({
  completed,
  total,
  title,
  size = 120,
  primaryColor = '#6366F1',
  secondaryColor = '#E5E7EB',
}: CompletionDonutProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="p-6 flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{completed}</span>
          {' of '}
          <span className="font-semibold text-gray-900">{total}</span>
          {' completed'}
        </p>
      </div>
    </Card>
  );
}

export default CompletionDonut;
