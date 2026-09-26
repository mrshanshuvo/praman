'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UpdateUrlOptions {
  key: string;
  value?: string | null;
  defaultValue?: string;
  omitDefault?: boolean;
  history?: 'replace' | 'push';
}

/**
 * Shared central URL mutation engine that:
 * 1. Preserves existing search params and URL hash (#anchor).
 * 2. Deduplicates no-op updates (does not push/replace if URL search has not changed).
 * 3. Removes default or empty values when omitDefault is true.
 * 4. Dispatches PopStateEvent so all hook instances and Next.js router stay in sync.
 */
function updateBrowserUrl({
  key,
  value,
  defaultValue,
  omitDefault = true,
  history = 'replace',
}: UpdateUrlOptions): void {
  if (typeof window === 'undefined') return;

  const currentSearch = window.location.search;
  const params = new URLSearchParams(currentSearch);

  const shouldDelete =
    value === undefined ||
    value === null ||
    value === '' ||
    (omitDefault && defaultValue !== undefined && value === defaultValue);

  if (shouldDelete) {
    params.delete(key);
  } else {
    params.set(key, value);
  }

  const query = params.toString();
  const pathname = window.location.pathname;
  const hash = window.location.hash || '';
  const nextSearch = query ? `?${query}` : '';
  const nextUrl = (query ? `${pathname}?${query}` : pathname) + hash;

  // No-op guard: skip history manipulation if the search parameters have not changed
  if (currentSearch === nextSearch) return;

  // Defer history manipulation and popstate dispatch out of the synchronous React render cycle.
  // This prevents React's "Cannot update a component (`Router`) while rendering a different component" error
  // when state setters or initializations trigger URL synchronization.
  queueMicrotask(() => {
    if (history === 'push') {
      window.history.pushState(null, '', nextUrl);
    } else {
      window.history.replaceState(null, '', nextUrl);
    }

    // Dispatch PopStateEvent so Next.js App Router and all hook instances update in sync
    try {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    } catch {
      window.dispatchEvent(new Event('popstate'));
    }
  });
}

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
 * Industry gold standard hook to synchronize active tabs with URL query parameters (?tab=...).
 *
 * Robustness guarantees:
 * - URL as the single source of truth (refresh-safe, bookmarkable, shareable deep links)
 * - Clean URLs: automatically strips the parameter when on defaultValue
 * - Instant zero-lag optimistic UI updates with non-blocking browser history sync
 * - Strict whitelist validation against invalid inputs or tampering
 * - Full browser Back/Forward (popstate) synchronization
 * - Non-destructive mutation preserving all sibling query parameters and URL #anchors
 * - Multi-instance broadcast: multiple components observing the same parameter update in sync
 * - No-op detection: prevents duplicate history entries when re-selecting the active tab
 */
export function useUrlTab<T extends string>({
  paramName = 'tab',
  defaultValue,
  validValues,
  omitDefault = true,
  history = 'replace',
}: UseUrlTabOptions<T>): [T, (tab: T | ((prev: T) => T)) => void] {
  const searchParams = useSearchParams();

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
    (newTabOrFn: T | ((prev: T) => T)) => {
      setActiveTabState((prev) => {
        const resolved =
          typeof newTabOrFn === 'function' ? (newTabOrFn as (prev: T) => T)(prev) : newTabOrFn;
        return getValidTab(resolved);
      });

      // Update URL outside the setState reducer function
      const resolved =
        typeof newTabOrFn === 'function'
          ? (newTabOrFn as (prev: T) => T)(activeTab)
          : newTabOrFn;
      const valid = getValidTab(resolved);
      updateBrowserUrl({
        key: paramName,
        value: valid,
        defaultValue,
        omitDefault,
        history,
      });
    },
    [activeTab, paramName, defaultValue, omitDefault, history, getValidTab],
  );

  // Sync state when URL searchParams change via Next.js router transitions
  useEffect(() => {
    const tabFromUrl = searchParams.get(paramName);
    const valid = getValidTab(tabFromUrl);
    setActiveTabState(valid);
  }, [searchParams, paramName, getValidTab]);

  // Sync state on browser Back / Forward (popstate) and programmatic updates
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

export interface UseUrlQueryParamOptions<T extends string = string> {
  /**
   * When true, removes the query parameter from the URL when value equals defaultValue or is empty.
   * Defaults to true.
   */
  omitDefault?: boolean;
  /**
   * History navigation mode ('replace' or 'push'). Defaults to 'replace'.
   */
  history?: 'replace' | 'push';
  /**
   * Optional whitelist of valid values to prevent invalid inputs
   */
  validValues?: readonly T[];
  /**
   * Optional debounce delay in milliseconds for URL updates (e.g. 250ms for search inputs).
   * React state updates immediately so inputs remain responsive, while URL writes are debounced.
   */
  debounceMs?: number;
}

/**
 * Reusable hook to synchronize a single URL query param (?key=value) with React state.
 * Supports typed defaults, clean URLs, hash preservation, multi-component synchronization,
 * and optional debouncing for high-frequency inputs.
 */
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue: T,
  options?: UseUrlQueryParamOptions<T>,
): [T, (value: T | undefined | ((prev: T) => T | undefined)) => void];
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue?: T,
  options?: UseUrlQueryParamOptions<T>,
): [T | undefined, (value: T | undefined | ((prev: T | undefined) => T | undefined)) => void];
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue?: T,
  options: UseUrlQueryParamOptions<T> = {},
): [T | undefined, (value: T | undefined | ((prev: T | undefined) => T | undefined)) => void] {
  const { omitDefault = true, history = 'replace', validValues, debounceMs = 0 } = options;
  const searchParams = useSearchParams();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getValidValue = useCallback(
    (val: string | null): T | undefined => {
      if (val !== null && val !== '') {
        if (!validValues || (validValues as readonly string[]).includes(val)) {
          return val as T;
        }
      }
      return defaultValue;
    },
    [defaultValue, validValues],
  );

  const [value, setValueState] = useState<T | undefined>(() => {
    return getValidValue(searchParams.get(key));
  });

  const setValue = useCallback(
    (newValueOrFn: (T | undefined) | ((prev: T | undefined) => T | undefined)) => {
      setValueState((prev) => {
        const resolved =
          typeof newValueOrFn === 'function'
            ? (newValueOrFn as (prev: T | undefined) => T | undefined)(prev)
            : newValueOrFn;
        return resolved !== undefined ? getValidValue(resolved) : defaultValue;
      });

      // Update URL outside the setState reducer function
      const resolved =
        typeof newValueOrFn === 'function'
          ? (newValueOrFn as (prev: T | undefined) => T | undefined)(value)
          : newValueOrFn;
      const valid = resolved !== undefined ? getValidValue(resolved) : defaultValue;

      if (debounceMs > 0) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          updateBrowserUrl({
            key,
            value: valid,
            defaultValue,
            omitDefault,
            history,
          });
        }, debounceMs);
      } else {
        updateBrowserUrl({
          key,
          value: valid,
          defaultValue,
          omitDefault,
          history,
        });
      }
    },
    [value, key, defaultValue, omitDefault, history, debounceMs, getValidValue],
  );

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Sync state when URL searchParams change via Next.js navigation
  useEffect(() => {
    const fromUrl = searchParams.get(key);
    setValueState(getValidValue(fromUrl));
  }, [searchParams, key, getValidValue]);

  // Sync state on browser Back / Forward (popstate) and programmatic updates
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        const fromUrl = currentParams.get(key);
        setValueState(getValidValue(fromUrl));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [key, getValidValue]);

  return [value, setValue];
}
