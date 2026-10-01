import { CandidateStatus, STATUS_CONFIG } from '@/types';

interface StatusBadgeProps {
  status: CandidateStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export function StatusBadge({ status, size = 'md', showDot = true }: StatusBadgeProps) {
  const meta = STATUS_CONFIG[status] || STATUS_CONFIG.APPLICATION_RECEIVED;

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5 font-medium',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border backdrop-blur-md transition-colors ${meta.color.badgeBg} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span className="relative flex">
          {meta.sentiment === 'positive' || meta.sentiment === 'in_progress' ? (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${meta.color.dot}`}
            />
          ) : null}
          <span className={`relative inline-flex rounded-full ${meta.color.dot} ${dotSizes[size]}`} />
        </span>
      )}
      <span className="font-semibold tracking-wide">{meta.label}</span>
    </span>
  );
}
