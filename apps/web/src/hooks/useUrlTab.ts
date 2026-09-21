'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export interface UseUrlTabOptions<T extends string> {
  paramName?: string;
  defaultValue: T;
  validValues?: readonly T[];
}

/**
 * Reusable hook to synchronize active tabs with URL query parameters (?tab=...)
 * Preserves tab position across page reloads, supports browser back/forward, and shareable URLs.
 */
export function useUrlTab<T extends string>({
  paramName = 'tab',
  defaultValue,
  validValues,
}: UseUrlTabOptions<T>): [T, (tab: T) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getValidTab = useCallback(
    (val: string | null): T => {
      if (val && (!validValues || (validValues as readonly string[]).includes(val))) {
        return val as T;
      }
      return defaultValue;
    },
    [defaultValue, validValues],
  );

  const [activeTab, setActiveTabState] = useState<T>(() =>
    getValidTab(searchParams.get(paramName)),
  );

  const setTab = useCallback(
    (newTab: T) => {
      setActiveTabState(newTab);
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        params.set(paramName, newTab);
        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;
        window.history.replaceState(null, '', nextUrl);
      }
    },
    [paramName, pathname],
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get(paramName);
    const valid = getValidTab(tabFromUrl);
    setActiveTabState(valid);
  }, [searchParams, paramName, getValidTab]);

  return [activeTab, setTab];
}

/**
 * Reusable hook to synchronize a single URL query param (?key=value) with React state
 */
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue?: T,
): [T | undefined, (value: T | undefined) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [value, setValueState] = useState<T | undefined>(() => {
    return (searchParams.get(key) as T) || defaultValue;
  });

  const setValue = useCallback(
    (newValue: T | undefined) => {
      setValueState(newValue);
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (newValue) {
          params.set(key, newValue);
        } else {
          params.delete(key);
        }
        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;
        window.history.replaceState(null, '', nextUrl);
      }
    },
    [key, pathname],
  );

  useEffect(() => {
    const fromUrl = searchParams.get(key) as T | null;
    setValueState(fromUrl || defaultValue);
  }, [searchParams, key, defaultValue]);

  return [value, setValue];
}
