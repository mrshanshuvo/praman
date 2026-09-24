export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const TOKEN_KEY = 'praman_auth_token';
export const REFRESH_TOKEN_KEY = 'praman_refresh_token';

let activeRefreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const storedRefreshToken =
        typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
      });

      if (!refreshRes.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
          document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            const loginUrl = new URL('/login', window.location.origin);
            loginUrl.searchParams.set('from', currentPath + window.location.search);
            window.location.replace(loginUrl.href);
          }
        }
        return null;
      }

      const data = await refreshRes.json();
      const newAccessToken: string = data.accessToken;
      const newRefreshToken: string | undefined = data.refreshToken;

      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, newAccessToken);
        const isSecure = window.location.protocol === 'https:';
        // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
        document.cookie = `${TOKEN_KEY}=${encodeURIComponent(newAccessToken)}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }
      }

      return newAccessToken;
    } catch {
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Automatically inject Bearer token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, attempt deduplicated silent refresh
  if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      res = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = Array.isArray(errorBody.message)
      ? errorBody.message.join(', ')
      : errorBody.message || `Request failed with status ${res.status}`;
    const err = new Error(message) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = errorBody;
    throw err;
  }

  return res.json();
}

export function getResumePdfUrl(id: string, templateId?: string, versionOrId?: string) {
  const queryParams = new URLSearchParams();
  if (templateId) queryParams.set('template', templateId);
  if (versionOrId) queryParams.set('version', versionOrId);
  const qs = queryParams.toString();
  return `${API_URL}/job-descriptions/${id}/resume/pdf${qs ? `?${qs}` : ''}`;
}

export async function fetchResumePdfBlob(
  id: string,
  templateId?: string,
  versionOrId?: string,
): Promise<Blob> {
  const url = getResumePdfUrl(id, templateId, versionOrId);
  const headers = new Headers();

  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem('praman_auth_token') ||
      localStorage.getItem('praman_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response = await fetch(url, { headers });

  // If 401 Unauthorized, attempt deduplicated silent refresh
  if (response.status === 401 && typeof window !== 'undefined') {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(url, { headers });
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }

  return response.blob();
}

export async function downloadResumePdf(
  id: string,
  templateId?: string,
  versionOrId?: string,
  filename?: string,
) {
  const blob = await fetchResumePdfBlob(id, templateId, versionOrId);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `resume_${templateId || 'modern-developer'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
