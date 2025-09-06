import { cn } from '@/lib/utils';
import { MedSummary } from '@/lib/types';

interface MedChipsProps {
  medSummary: MedSummary;
  className?: string;
}

const changeIcons = {
  up: '↑',
  down: '↓',
  steady: '→',
};

const changeStyles = {
  up: 'bg-red-50 text-red-700 border-red-200',
  down: 'bg-blue-50 text-blue-700 border-blue-200',
  steady: 'bg-gray-50 text-gray-700 border-gray-200',
};

export function MedChips({ medSummary, className }: MedChipsProps) {
  const entries = Object.entries(medSummary).slice(0, 3); // Show max 3 changes

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {entries.map(([medication, change]) => (
        <span
          key={medication}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border',
            changeStyles[change]
          )}
        >
          <span className="text-sm">{changeIcons[change]}</span>
          <span className="truncate max-w-20" title={medication}>
            {medication}
          </span>
        </span>
      ))}
    </div>
  );
}