'use client';

import type { SkillLevel } from '@praman/schemas';
import {
  Award,
  Check,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useProfileMutations } from '@/hooks/usePramanApi';

interface SkillClaimTuningDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  skillName: string;
  existingSkill?: {
    id: string;
    name: string;
    level: SkillLevel;
    evidence?: string | null;
  } | null;
  jdType?: 'required' | 'preferred';
  onSaved: (skill: { name: string; level: SkillLevel }) => void;
}

const LEVEL_OPTIONS: {
  level: SkillLevel;
  title: string;
  badgeLabel: string;
  colorClass: string;
  borderClass: string;
  icon: typeof Award;
  description: string;
  impact: string;
}[] = [
  {
    level: 'EXPERIENCED',
    title: 'Experienced',
    badgeLabel: '1.0x Match',
    colorClass: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30',
    borderClass: 'border-brand-cyan bg-brand-cyan/15 ring-1 ring-brand-cyan/40',
    icon: CheckCircle2,
    description: 'Demonstrated mastery across production systems or verified deliverables.',
    impact: 'Full 1.0x match weight. High-priority candidate strength in resume strategy.',
  },
  {
    level: 'WORKING_KNOWLEDGE',
    title: 'Working Knowledge',
    badgeLabel: '0.5x Match',
    colorClass: 'text-success bg-success/10 border-success/30',
    borderClass: 'border-success bg-success/15 ring-1 ring-success/40',
    icon: Sparkles,
    description: 'Capable practitioner with practical project experience or adjacent stack usage.',
    impact: '0.5x partial match weight. Positioned as supportive competence.',
  },
  {
    level: 'LEARNING',
    title: 'Learning',
    badgeLabel: 'Cautionary',
    colorClass: 'text-warning bg-warning/10 border-warning/30',
    borderClass: 'border-warning bg-warning/15 ring-1 ring-warning/40',
    icon: HelpCircle,
    description: 'Currently studying or developing foundational capability.',
    impact: 'Treated as growth area. AI prompt prevents overstating as mature competency.',
  },
  {
    level: 'NOT_LEARNED',
    title: 'Not Learned',
    badgeLabel: 'Do Not Claim',
    colorClass: 'text-brand-pink bg-brand-pink/10 border-brand-pink/30',
    borderClass: 'border-brand-pink bg-brand-pink/15 ring-1 ring-brand-pink/40',
    icon: ShieldAlert,
    description: 'Unverified or unfamiliar technology.',
    impact:
      'Strict safeguard: Enforces "Do Not Claim" rule. AI is prohibited from inventing bullet claims.',
  },
];

export function SkillClaimTuningDialog({
  isOpen,
  onOpenChange,
  skillName,
  existingSkill,
  jdType,
  onSaved,
}: SkillClaimTuningDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>(
    existingSkill?.level || 'EXPERIENCED',
  );
  const [evidence, setEvidence] = useState(existingSkill?.evidence || '');
  const [isSaving, setIsSaving] = useState(false);

  const { addSkill, updateSkill } = useProfileMutations();

  useEffect(() => {
    if (existingSkill) {
      setSelectedLevel(existingSkill.level);
      setEvidence(existingSkill.evidence || '');
    } else {
      setSelectedLevel('EXPERIENCED');
      setEvidence('');
    }
  }, [existingSkill, skillName]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (existingSkill?.id) {
        await updateSkill.mutateAsync({
          id: existingSkill.id,
          data: {
            name: skillName,
            level: selectedLevel,
            evidence: evidence.trim() || undefined,
          },
        });
      } else {
        await addSkill.mutateAsync({
          name: skillName,
          level: selectedLevel,
          evidence: evidence.trim() || undefined,
        });
      }

      onSaved({ name: skillName, level: selectedLevel });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update skill claim:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-5">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-xs font-mono border-brand-cyan/30 text-brand-cyan bg-brand-cyan/10"
            >
              Skill Claim Audit
            </Badge>
            {jdType && (
              <Badge variant="outline" className="text-xs font-mono border-border bg-muted/50">
                JD {jdType === 'required' ? 'Required' : 'Preferred'}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
            <span>{skillName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Adjust candidate ground-truth claim. This dictates deterministic match scoring and sets
            hard boundaries for the Stage 4 resume generator.
          </DialogDescription>
        </DialogHeader>

        {/* 4-Tier Interactive Selector */}
        <div className="space-y-2 py-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Proficiency & Claim Boundary
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LEVEL_OPTIONS.map((opt) => {
              const isSelected = selectedLevel === opt.level;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => setSelectedLevel(opt.level)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? opt.borderClass
                      : 'border-border bg-muted/20 hover:border-border/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{opt.title}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-2xs font-mono px-1.5 py-0 ${opt.colorClass}`}
                      >
                        {opt.badgeLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{opt.description}</p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-border/40 text-2xs font-mono text-muted-foreground">
                    {opt.impact}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Evidence Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Ground-Truth Evidence / Notes (Optional)</span>
            <span className="text-2xs font-normal text-muted-foreground">e.g. projects, repos</span>
          </label>
          <Textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="e.g. Architected microservices with Kafka in FinTech production ledger (2024)..."
            className="text-xs h-16 resize-none bg-muted/30 border-border"
          />
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Claim Level</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
