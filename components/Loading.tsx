interface LoadingProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ fullScreen = true, size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className} animate-fade-in`}>
      <div className={`animate-spin rounded-full border-b-2 border-brand-500 ${sizeClasses[size]}`} />
    </div>
  );
}

