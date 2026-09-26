'use client';

import { ThemePalettePicker } from '@/components/ThemePalettePicker';

interface ThemeToggleProps {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Backward-compatible ThemeToggle component now backed by the Dynamic Theme Engine.
 * Provides both 5-palette selection and Light/Dark/Auto mode switching.
 */
export function ThemeToggle({ align = 'end', side = 'top', className }: ThemeToggleProps) {
  return <ThemePalettePicker align={align} side={side} className={className} />;
}
