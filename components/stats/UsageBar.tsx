interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

export function UsageBar({ label, used, limit, unit = '' }: UsageBarProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span
          className={`font-semibold ${
            isOverLimit
              ? 'text-red-600 dark:text-red-400'
              : isNearLimit
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            isOverLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-yellow-500'
              : 'bg-brand-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          {isOverLimit
            ? 'Limit exceeded'
            : 'Approaching limit - consider upgrading'}
        </p>
      )}
    </div>
  );
}

