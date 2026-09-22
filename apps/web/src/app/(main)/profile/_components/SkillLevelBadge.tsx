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
          bg: 'bg-brand-cyan/15 border-brand-cyan/40 text-brand-cyan',
          dot: 'bg-brand-cyan',
          label: 'Experienced',
        };
      case 'WORKING_KNOWLEDGE':
        return {
          bg: 'bg-brand-cyan/10 border-brand-cyan/25 text-brand-cyan/80',
          dot: 'bg-brand-cyan/80',
          label: 'Working Knowledge',
        };
      case 'LEARNING':
        return {
          bg: 'bg-brand-pink/10 border-brand-pink/25 text-brand-pink/80',
          dot: 'bg-brand-pink/80',
          label: 'Learning (Gap)',
        };
      case 'NOT_LEARNED':
        return {
          bg: 'bg-brand-pink/15 border-brand-pink/40 text-brand-pink',
          dot: 'bg-brand-pink',
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
