import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  risk: 'high' | 'medium' | 'low';
  probability?: number;
  className?: string;
}

const riskStyles = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

export function RiskBadge({ risk, probability, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
        riskStyles[risk],
        className
      )}
    >
      {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
      {probability && (
        <span className="text-xs opacity-75">
          ({Math.round(probability * 100)}%)
        </span>
      )}
    </span>
  );
}