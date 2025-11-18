interface FeatureBadgeProps {
  enabled: boolean;
  label: string;
}

export function FeatureBadge({ enabled, label }: FeatureBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          enabled
            ? 'bg-green-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />
      <span
        className={`text-sm ${
          enabled
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400 line-through'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

