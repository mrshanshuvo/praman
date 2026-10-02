import type { SkillLevel } from '@praman/schemas';
import type React from 'react';
import { Badge } from '@/components/ui/badge';

interface SkillLevelBadgeProps {
  level: SkillLevel | string;
  className?: string;
  showDot?: boolean;
}

export const SkillLevelBadge: React.FC<SkillLevelBadgeProps> = ({
  level,
  className = '',
  showDot = true,
}) => {
  const getBadgeStyle = (lvl: string) => {
    switch (lvl) {
      case 'EXPERIENCED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500 dark:bg-emerald-400',
          label: 'Experienced',
        };
      case 'WORKING_KNOWLEDGE':
        return {
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400',
          dot: 'bg-sky-500 dark:bg-sky-400',
          label: 'Working Knowledge',
        };
      case 'LEARNING':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500 dark:bg-amber-400',
          label: 'Learning (Gap)',
        };
      case 'NOT_LEARNED':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
          dot: 'bg-rose-500 dark:bg-rose-400',
          label: 'Not Learned (Forbidden)',
        };
      default:
        return {
          bg: 'bg-muted border-border text-muted-foreground',
          dot: 'bg-muted-foreground',
          label: lvl,
        };
    }
  };

  const style = getBadgeStyle(level);

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 px-2.5 py-0.5 rounded-full font-medium ${style.bg} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      <span>{style.label}</span>
    </Badge>
  );
};
