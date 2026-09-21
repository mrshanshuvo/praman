'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom cross-instance event dispatched whenever URL search parameters are mutated programmatically.
 * Ensures sibling components and multiple hook instances on the same page remain synchronized in 0ms.
 */
const URL_CHANGE_EVENT = 'praman:url-change';

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
 * 2. Deduplicates no-op updates (does not push/replace if URL has not changed).
 * 3. Removes default or empty values when omitDefault is true.
 * 4. Dispatches both custom event and PopStateEvent so all hook instances and Next.js router stay in sync.
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
  const nextUrl = (query ? `${pathname}?${query}` : pathname) + hash;
  const currentFull = pathname + currentSearch + hash;

  // No-op guard: skip history manipulation if the URL has not actually changed
  if (currentFull === nextUrl) return;

  if (history === 'push') {
    window.history.pushState(null, '', nextUrl);
  } else {
    window.history.replaceState(null, '', nextUrl);
  }

  // Notify intra-page hook instances synchronously
  window.dispatchEvent(new CustomEvent(URL_CHANGE_EVENT, { detail: { key, value } }));

  // Dispatch PopStateEvent so Next.js App Router internal router updates its searchParams tree
  try {
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  } catch {
    // Fallback for non-standard test runners
  }
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
}: UseUrlTabOptions<T>): [T, (tab: T) => void] {
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
    (newTab: T) => {
      const valid = getValidTab(newTab);
      setActiveTabState(valid);

      updateBrowserUrl({
        key: paramName,
        value: valid,
        defaultValue,
        omitDefault,
        history,
      });
    },
    [paramName, defaultValue, omitDefault, history, getValidTab],
  );

  // Sync state when URL searchParams change via Next.js router transitions
  useEffect(() => {
    const tabFromUrl = searchParams.get(paramName);
    const valid = getValidTab(tabFromUrl);
    setActiveTabState(valid);
  }, [searchParams, paramName, getValidTab]);

  // Sync state on browser Back / Forward (popstate) and intra-page programmatic events
  useEffect(() => {
    const handleUrlSync = () => {
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        setActiveTabState(getValidTab(currentParams.get(paramName)));
      }
    };

    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener(URL_CHANGE_EVENT, handleUrlSync);
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener(URL_CHANGE_EVENT, handleUrlSync);
    };
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
}

/**
 * Reusable hook to synchronize a single URL query param (?key=value) with React state.
 * Supports typed defaults, clean URLs, hash preservation, and multi-component synchronization.
 */
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue: T,
  options?: UseUrlQueryParamOptions<T>,
): [T, (value: T | undefined) => void];
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue?: T,
  options?: UseUrlQueryParamOptions<T>,
): [T | undefined, (value: T | undefined) => void];
export function useUrlQueryParam<T extends string>(
  key: string,
  defaultValue?: T,
  options: UseUrlQueryParamOptions<T> = {},
): [T | undefined, (value: T | undefined) => void] {
  const { omitDefault = true, history = 'replace', validValues } = options;
  const searchParams = useSearchParams();

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
    (newValue: T | undefined) => {
      const valid = newValue !== undefined ? getValidValue(newValue) : defaultValue;
      setValueState(valid);

      updateBrowserUrl({
        key,
        value: valid,
        defaultValue,
        omitDefault,
        history,
      });
    },
    [key, defaultValue, omitDefault, history, getValidValue],
  );

  // Sync state when URL searchParams change via Next.js navigation
  useEffect(() => {
    const fromUrl = searchParams.get(key);
    setValueState(getValidValue(fromUrl));
  }, [searchParams, key, getValidValue]);

  // Sync state on browser Back / Forward (popstate) and intra-page programmatic events
  useEffect(() => {
    const handleUrlSync = () => {
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        const fromUrl = currentParams.get(key);
        setValueState(getValidValue(fromUrl));
      }
    };

    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener(URL_CHANGE_EVENT, handleUrlSync);
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener(URL_CHANGE_EVENT, handleUrlSync);
    };
  }, [key, getValidValue]);

  return [value, setValue];
}
