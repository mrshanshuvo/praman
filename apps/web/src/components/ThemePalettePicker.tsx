'use client';

import { Check, Laptop, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePalette } from '@/providers/PaletteProvider';

interface ThemePalettePickerProps {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function ThemePalettePicker({
  align = 'end',
  side = 'top',
  className,
}: ThemePalettePickerProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { palette, setPalette, palettes, currentPaletteMeta } = usePalette();
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
        aria-label="Theme settings"
      >
        <div className="w-4 h-4" />
      </Button>
    );
  }

  const isDark = (resolvedTheme || theme) === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={
              className ||
              'w-8 h-8 rounded-lg border border-border bg-card/60 hover:bg-accent hover:text-accent-foreground text-foreground transition-all duration-200 relative group'
            }
            title={`Theme: ${currentPaletteMeta.name} (${isDark ? 'Dark' : 'Light'})`}
            aria-label="Theme & palette selector"
          >
            {isDark ? (
              <Moon className="w-4 h-4 text-brand-cyan transition-transform duration-300 group-hover:rotate-12" />
            ) : (
              <Sun className="w-4 h-4 text-primary transition-transform duration-300 group-hover:rotate-45" />
            )}
            {/* Tiny color badge showing current active palette */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
              style={{ backgroundColor: currentPaletteMeta.primaryColor }}
            />
          </Button>
        }
      />

      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        className="w-64 p-1.5 shadow-xl border border-border bg-card/95 backdrop-blur-md"
      >
        {/* Illumination Mode Section */}
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2 py-1">
          <span>Appearance Mode</span>
        </DropdownMenuLabel>

        <div className="grid grid-cols-3 gap-1 px-1 py-1 mb-1 bg-muted/50 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
              theme === 'light'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Light mode"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
              theme === 'dark'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dark mode"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
              theme === 'system'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="System theme"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Auto</span>
          </button>
        </div>

        <DropdownMenuSeparator />

        {/* Color Palette Section */}
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2 py-1">
          <Palette className="w-3 h-3 text-primary" />
          <span>Color Palette (10 Themes)</span>
        </DropdownMenuLabel>

        <div className="space-y-0.5 mt-0.5">
          {palettes.map((p) => {
            const isSelected = palette === p.id;
            return (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Two-tone preview swatch circle */}
                  <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-2xs">
                    <div
                      className="absolute inset-y-0 left-0 w-1/2"
                      style={{ backgroundColor: p.primaryColor }}
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-1/2"
                      style={{ backgroundColor: p.accentColor }}
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs truncate leading-tight">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                      {p.tagline}
                    </span>
                  </div>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
