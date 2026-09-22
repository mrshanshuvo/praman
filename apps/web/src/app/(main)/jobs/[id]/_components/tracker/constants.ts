import type { InterviewStage, NoteTag } from '@praman/schemas';

export interface StagePreset {
  stage: InterviewStage;
  title: string;
  desc: string;
}

export const STAGE_PRESETS: StagePreset[] = [
  {
    stage: 'SCREENING',
    title: 'Recruiter Screening',
    desc: 'Initial intro and culture fit',
  },
  {
    stage: 'TECHNICAL',
    title: 'Technical Screen / Coding',
    desc: 'Live algorithmic or problem solving',
  },
  {
    stage: 'TAKE_HOME',
    title: 'Take-Home Assignment',
    desc: 'Practical project or architecture test',
  },
  {
    stage: 'SYSTEM_DESIGN',
    title: 'System Design & Architecture',
    desc: 'High scale distributed systems',
  },
  {
    stage: 'BEHAVIORAL',
    title: 'Behavioral & Core Values',
    desc: 'Leadership principles and teamwork',
  },
  {
    stage: 'HIRING_MANAGER',
    title: 'Hiring Manager 1-on-1',
    desc: 'Team goals, scope, and vision',
  },
  {
    stage: 'FINAL_ROUND',
    title: 'Final / Executive Round',
    desc: 'Cross-functional and executive review',
  },
  {
    stage: 'OFFER',
    title: 'Offer Discussion & Negotiation',
    desc: 'Compensation, perks, and start date',
  },
];

export interface NoteTagMeta {
  tag: NoteTag;
  label: string;
  color: string;
}

export const NOTE_TAGS: NoteTagMeta[] = [
  { tag: 'GENERAL', label: 'General', color: 'bg-muted text-foreground' },
  {
    tag: 'PREP',
    label: 'Interview Prep',
    color: 'bg-info/10 text-info border-info/30',
  },
  {
    tag: 'INTERVIEW_FEEDBACK',
    label: 'Feedback / Debrief',
    color: 'bg-success/10 text-success border-success/30',
  },
  {
    tag: 'SALARY_BENEFITS',
    label: 'Salary & Perks',
    color: 'bg-warning/10 text-warning border-warning/30',
  },
  {
    tag: 'RECRUITER_INTEL',
    label: 'Recruiter Intel',
    color: 'bg-status-neutral/10 text-status-neutral border-status-neutral/30',
  },
  {
    tag: 'FOLLOW_UP',
    label: 'Follow Up',
    color: 'bg-brand-pink/10 text-brand-pink border-brand-pink/30',
  },
];
