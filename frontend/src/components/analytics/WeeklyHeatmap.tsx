import { useMemo } from 'react';
import { Card } from '../common';

interface ActivityData {
  date: string;
  value: number;
}

interface WeeklyHeatmapProps {
  data: ActivityData[];
  title: string;
  weeks?: number;
}

export function WeeklyHeatmap({
  data,
  title,
  weeks = 12,
}: WeeklyHeatmapProps) {
  const { grid, maxValue, monthLabels } = useMemo(() => {
    const dataMap = new Map(data.map((d) => [d.date, d.value]));
    const max = Math.max(...data.map((d) => d.value), 1);

    // Generate grid for last N weeks
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Start from the beginning of the week
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek - (weeks - 1) * 7);

    const gridData: { date: string; value: number; dayOfWeek: number; displayDate: string }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let week = 0; week < weeks; week++) {
      const weekData: { date: string; value: number; dayOfWeek: number; displayDate: string }[] = [];

      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + week * 7 + day);
        const dateStr = date.toISOString().split('T')[0];
        const displayDate = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        // Track month labels (first day of week)
        if (day === 0 && date.getMonth() !== lastMonth) {
          months.push({
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex: week,
          });
          lastMonth = date.getMonth();
        }

        // Don't show future dates
        if (date > today) {
          weekData.push({ date: dateStr, value: -1, dayOfWeek: day, displayDate });
        } else {
          weekData.push({
            date: dateStr,
            value: dataMap.get(dateStr) || 0,
            dayOfWeek: day,
            displayDate,
          });
        }
      }

      gridData.push(weekData);
    }

    return {
      grid: gridData,
      maxValue: max,
      monthLabels: months,
    };
  }, [data, weeks]);

  const getColor = (value: number, max: number): string => {
    if (value < 0) return 'transparent';
    if (value === 0) return '#f3f4f6';

    const ratio = value / max;
    if (ratio < 0.25) return '#c7d2fe';
    if (ratio < 0.5) return '#a5b4fc';
    if (ratio < 0.75) return '#818cf8';
    return '#6366f1';
  };

  const formatTooltip = (day: { value: number; displayDate: string }): string => {
    if (day.value < 0) return '';
    if (day.value === 0) return `${day.displayDate}\nNo activity`;
    return `${day.displayDate}\n${day.value} video${day.value === 1 ? '' : 's'} completed`;
  };

  // Day labels - show Mon, Wed, Fri
  const dayLabels = [
    { label: '', row: 0 },     // Sun - empty
    { label: 'Mon', row: 1 },
    { label: '', row: 2 },     // Tue - empty
    { label: 'Wed', row: 3 },
    { label: '', row: 4 },     // Thu - empty
    { label: 'Fri', row: 5 },
    { label: '', row: 6 },     // Sat - empty
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="flex flex-col gap-1">
        {/* Month labels */}
        <div className="flex ml-8">
          {monthLabels.map((month, i) => {
            // Calculate position based on week index
            const nextMonthWeek = monthLabels[i + 1]?.weekIndex ?? weeks;
            const span = nextMonthWeek - month.weekIndex;
            return (
              <div
                key={`${month.label}-${i}`}
                className="text-xs text-gray-400"
                style={{
                  width: `${span * 20}px`,
                  minWidth: span > 1 ? 'auto' : '20px',
                }}
              >
                {span > 1 ? month.label : ''}
              </div>
            );
          })}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2 w-7">
            {dayLabels.map((day, i) => (
              <div
                key={i}
                className="h-4 text-xs text-gray-400 flex items-center justify-end"
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="w-4 h-4 rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-primary/30"
                    style={{ backgroundColor: getColor(day.value, maxValue) }}
                    title={formatTooltip(day)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          {['#f3f4f6', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'].map((color) => (
            <div
              key={color}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </Card>
  );
}

export default WeeklyHeatmap;
