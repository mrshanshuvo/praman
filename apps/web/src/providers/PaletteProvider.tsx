'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type PaletteId = 'enterprise' | 'cyberpunk' | 'linear' | 'ocean' | 'editorial';

export interface PaletteMeta {
  id: PaletteId;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  lightBg: string;
  darkBg: string;
}

export const PALETTES: PaletteMeta[] = [
  {
    id: 'enterprise',
    name: 'Enterprise Modern',
    tagline: 'Corporate SaaS & Royal Blue',
    primaryColor: '#3B71CA',
    accentColor: '#DC4C64',
    lightBg: '#FBFBFB',
    darkBg: '#181515',
  },
  {
    id: 'cyberpunk',
    name: 'Cyber Obsidian',
    tagline: 'AI Terminal & Electric Cyan',
    primaryColor: '#08D9D6',
    accentColor: '#FF2E63',
    lightBg: '#F8FAFC',
    darkBg: '#090B10',
  },
  {
    id: 'linear',
    name: 'Linear Stealth',
    tagline: 'Developer Suite & Indigo Zinc',
    primaryColor: '#5E6AD2',
    accentColor: '#E11D48',
    lightBg: '#FAFAFA',
    darkBg: '#09090B',
  },
  {
    id: 'ocean',
    name: 'Deep Oceanic',
    tagline: 'High-Trust Navy & Deep Azure',
    primaryColor: '#0284C7',
    accentColor: '#DC2626',
    lightBg: '#F8FAFC',
    darkBg: '#080D1A',
  },
  {
    id: 'editorial',
    name: 'Warm Editorial',
    tagline: 'Notion Stone & Warm Amber',
    primaryColor: '#B45309',
    accentColor: '#BE123C',
    lightBg: '#FAFAF9',
    darkBg: '#141210',
  },
];

const STORAGE_KEY = 'praman-palette';
const DEFAULT_PALETTE: PaletteId = 'enterprise';

interface PaletteContextType {
  palette: PaletteId;
  setPalette: (id: PaletteId) => void;
  palettes: PaletteMeta[];
  currentPaletteMeta: PaletteMeta;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);

  // Sync initial state from document.documentElement or localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as PaletteId | null;
      if (stored && PALETTES.some((p) => p.id === stored)) {
        setPaletteState(stored);
        document.documentElement.dataset.palette = stored;
      } else {
        const currentData = document.documentElement.dataset.palette as PaletteId;
        if (currentData && PALETTES.some((p) => p.id === currentData)) {
          setPaletteState(currentData);
        } else {
          document.documentElement.dataset.palette = DEFAULT_PALETTE;
        }
      }
    } catch {
      // Fallback if localStorage is restricted
      document.documentElement.dataset.palette = DEFAULT_PALETTE;
    }
  }, []);

  const setPalette = useCallback((id: PaletteId) => {
    setPaletteState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore storage errors in private browsing
    }
    document.documentElement.dataset.palette = id;
  }, []);

  const currentPaletteMeta = useMemo(() => {
    return PALETTES.find((p) => p.id === palette) || PALETTES[0];
  }, [palette]);

  const value = useMemo(
    () => ({
      palette,
      setPalette,
      palettes: PALETTES,
      currentPaletteMeta,
    }),
    [palette, setPalette, currentPaletteMeta],
  );

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('usePalette must be used within a PaletteProvider');
  }
  return context;
}
