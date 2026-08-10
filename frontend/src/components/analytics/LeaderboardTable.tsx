import { Card, Badge } from '../common';

interface LeaderboardItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
  primaryValue: number;
  secondaryValue?: number;
  primaryLabel: string;
  secondaryLabel?: string;
}

interface LeaderboardTableProps {
  title: string;
  items: LeaderboardItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function LeaderboardTable({
  title,
  items,
  isLoading,
  emptyMessage = 'No data available',
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Rank */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              index === 0 ? 'bg-yellow-100 text-yellow-700' :
              index === 1 ? 'bg-gray-100 text-gray-600' :
              index === 2 ? 'bg-orange-100 text-orange-700' :
              'bg-gray-50 text-gray-500'
            }`}>
              {index + 1}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium flex-shrink-0">
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                item.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-sm text-gray-500">{item.primaryLabel}</p>
            </div>

            {/* Values */}
            <div className="text-right">
              <Badge variant={item.primaryValue >= 80 ? 'success' : item.primaryValue >= 60 ? 'warning' : 'default'}>
                {item.primaryValue}
              </Badge>
              {item.secondaryValue !== undefined && item.secondaryLabel && (
                <p className="text-xs text-gray-500 mt-1">
                  {item.secondaryValue} {item.secondaryLabel}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default LeaderboardTable;
