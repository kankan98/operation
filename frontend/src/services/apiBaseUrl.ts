export type ApiBaseUrlLocation = Pick<Location, 'hostname'>;

const SAME_ORIGIN_API_BASE_URL = '/api';

export function resolveApiBaseUrl(
  configuredBaseUrl = import.meta.env.VITE_API_BASE_URL,
  pageLocation: ApiBaseUrlLocation | undefined = currentLocation(),
): string {
  const baseUrl = configuredBaseUrl?.trim();
  if (!baseUrl) return SAME_ORIGIN_API_BASE_URL;
  if (baseUrl.startsWith('/')) return baseUrl;

  const apiHostname = parseHostname(baseUrl);
  if (
    apiHostname &&
    isLoopbackHostname(apiHostname) &&
    !isLoopbackHostname(pageLocation?.hostname)
  ) {
    return SAME_ORIGIN_API_BASE_URL;
  }

  return baseUrl;
}

export function buildApiUrl(path: string, baseUrl = resolveApiBaseUrl()): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

function currentLocation(): ApiBaseUrlLocation | undefined {
  return typeof globalThis.location === 'undefined' ? undefined : globalThis.location;
}

function parseHostname(baseUrl: string): string | null {
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return null;
  }
}

function isLoopbackHostname(hostname: string | null | undefined): boolean {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return false;
  if (normalized === 'localhost' || normalized === '::1') return true;
  return /^127(?:\.\d{1,3}){3}$/.test(normalized);
}

function normalizeHostname(hostname: string | null | undefined): string {
  return (hostname ?? '').trim().toLowerCase().replace(/^\[|\]$/g, '');
}
