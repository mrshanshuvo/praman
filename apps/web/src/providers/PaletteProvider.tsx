'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type PaletteId =
  | 'enterprise'
  | 'cyberpunk'
  | 'linear'
  | 'ocean'
  | 'editorial'
  | 'staradmin'
  | 'skydash'
  | 'stellar'
  | 'azia'
  | 'justdo'
  | 'plusadmin'
  | 'breeze';

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
  {
    id: 'staradmin',
    name: 'StarAdmin Sunset',
    tagline: 'Warm Peach & Deep Charcoal',
    primaryColor: '#F29F67',
    accentColor: '#E04F5F',
    lightBg: '#FAF8F5',
    darkBg: '#161622',
  },
  {
    id: 'skydash',
    name: 'Skydash Royal',
    tagline: 'Imperial Indigo & Soft Sky',
    primaryColor: '#4B49AC',
    accentColor: '#EB575D',
    lightBg: '#F8F9FE',
    darkBg: '#0E0E1F',
  },
  {
    id: 'stellar',
    name: 'Stellar Obsidian',
    tagline: 'Neon Emerald & Midnight Obsidian',
    primaryColor: '#38CE3C',
    accentColor: '#FF4D6B',
    lightBg: '#F8FAFC',
    darkBg: '#0F0F17',
  },
  {
    id: 'azia',
    name: 'Azia Orchid',
    tagline: 'Deep Orchid & Classic Blue',
    primaryColor: '#6F42C1',
    accentColor: '#00CCCC',
    lightBg: '#F8FAFC',
    darkBg: '#0C0A14',
  },
  {
    id: 'justdo',
    name: 'JustDo Marigold',
    tagline: 'Vibrant Marigold & Electric Blue',
    primaryColor: '#F5A623',
    accentColor: '#248AFD',
    lightBg: '#FAFBFD',
    darkBg: '#0C1017',
  },
  {
    id: 'plusadmin',
    name: 'Plusadmin Cobalt',
    tagline: 'Fintech Cobalt & Neon Raspberry',
    primaryColor: '#1A55E3',
    accentColor: '#FF0854',
    lightBg: '#F8FAFC',
    darkBg: '#080B14',
  },
  {
    id: 'breeze',
    name: 'Breeze Twilight',
    tagline: 'Deep Twilight & Vivid Turquoise',
    primaryColor: '#423A8E',
    accentColor: '#00CCCD',
    lightBg: '#F7F8FC',
    darkBg: '#0B0916',
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
