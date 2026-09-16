'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className="w-8 h-8 rounded-lg border border-border bg-card/40 text-muted-foreground"
        aria-label="Toggle theme"
      >
        <div className="w-4 h-4" />
      </Button>
    );
  }

  const isDark = (resolvedTheme || theme) === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-8 h-8 rounded-lg border border-border bg-card/60 hover:bg-accent hover:text-accent-foreground text-foreground transition-all duration-200"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-brand-cyan transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand-dark transition-transform duration-300 hover:-rotate-12" />
      )}
    </Button>
  );
}
