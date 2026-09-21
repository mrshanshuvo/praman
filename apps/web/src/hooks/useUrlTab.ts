'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export interface UseUrlTabOptions<T extends string> {
  /**
   * The query parameter name in the URL (defaults to 'tab')
   */
  paramName?: string;
  /**
   * The fallback tab value when the query parameter is absent or invalid
   */
  defaultValue: T;
  /**
   * Whitelist of acceptable tab values to prevent invalid inputs
   */
  validValues?: readonly T[];
  /**
   * When true, removes the query parameter from the URL when active tab equals defaultValue.
   * Keeps URLs clean (e.g. `/profile` instead of `/profile?tab=personal`).
   * Defaults to true.
   */
  omitDefault?: boolean;
  /**
   * History navigation mode:
   * - 'replace' (default): updates current history entry so tab switching doesn't flood browser Back button
   * - 'push': adds a new history entry so browser Back navigates to previous tab
   */
  history?: 'replace' | 'push';
}

/**
 * Industry-grade hook to synchronize active tabs with URL query parameters (?tab=...)
 * Features:
 * - URL as the single source of truth (refresh-safe, bookmarkable, shareable deep links)
 * - Clean URLs: omits the query parameter when set to the default value
 * - Instant zero-lag UI updates with non-blocking browser history sync
 * - Strict whitelist validation against invalid inputs or tampering
 * - Full browser Back/Forward (popstate) synchronization
 * - Non-destructive mutation preserving all sibling query parameters
 */
export function useUrlTab<T extends string>({
  paramName = 'tab',
  defaultValue,
  validValues,
  omitDefault = true,
  history = 'replace',
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

        if (omitDefault && newTab === defaultValue) {
          params.delete(paramName);
        } else if (newTab) {
          params.set(paramName, newTab);
        } else {
          params.delete(paramName);
        }

        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;

        if (history === 'push') {
          window.history.pushState(null, '', nextUrl);
        } else {
          window.history.replaceState(null, '', nextUrl);
        }
      }
    },
    [paramName, pathname, defaultValue, omitDefault, history],
  );

  // Sync state when URL searchParams change via Next.js navigation
  useEffect(() => {
    const tabFromUrl = searchParams.get(paramName);
    const valid = getValidTab(tabFromUrl);
    setActiveTabState(valid);
  }, [searchParams, paramName, getValidTab]);

  // Handle browser Back / Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        setActiveTabState(getValidTab(currentParams.get(paramName)));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [paramName, getValidTab]);

  return [activeTab, setTab];
}

export interface UseUrlQueryParamOptions {
  /**
   * When true, removes the query parameter from the URL when value equals defaultValue or is empty.
   * Defaults to true.
   */
  omitDefault?: boolean;
  /**
   * History navigation mode ('replace' or 'push'). Defaults to 'replace'.
   */
  history?: 'replace' | 'push';
}

/**
 * Reusable hook to synchronize a single URL query param (?key=value) with React state.
 * Supports typed defaults, clean URLs (omitting default values), and browser popstate sync.
 */
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue: T,
  options?: UseUrlQueryParamOptions,
): [T, (value: T | undefined) => void];
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue?: T,
  options?: UseUrlQueryParamOptions,
): [T | undefined, (value: T | undefined) => void];
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue?: T,
  options: UseUrlQueryParamOptions = {},
): [T | undefined, (value: T | undefined) => void] {
  const { omitDefault = true, history = 'replace' } = options;
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

        if (!newValue || (omitDefault && defaultValue !== undefined && newValue === defaultValue)) {
          params.delete(key);
        } else {
          params.set(key, newValue);
        }

        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;

        if (history === 'push') {
          window.history.pushState(null, '', nextUrl);
        } else {
          window.history.replaceState(null, '', nextUrl);
        }
      }
    },
    [key, pathname, defaultValue, omitDefault, history],
  );

  // Sync state when URL searchParams change
  useEffect(() => {
    const fromUrl = searchParams.get(key) as T | null;
    setValueState(fromUrl || defaultValue);
  }, [searchParams, key, defaultValue]);

  // Handle browser Back / Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        const fromUrl = currentParams.get(key) as T | null;
        setValueState(fromUrl || defaultValue);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [key, defaultValue]);

  return [value, setValue];
}
