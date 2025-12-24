/**
 * API configuration (frontend)
 *
 * Goal: never hardcode localhost as a default.
 * - In dev, use Vite proxy by default via relative "/api".
 * - In prod, "/api" hits same-origin (e.g. Vercel routes).
 * - If you deploy API elsewhere, set VITE_API_URL.
 */
function stripTrailingSlash(value: string): string {
  return value.length > 1 ? value.replace(/\/+$/, '') : value
}

/**
 * Join a base URL/path and an endpoint path safely.
 *
 * Examples:
 * - joinUrl('/api', '/auth/login') => '/api/auth/login'
 * - joinUrl('https://x.com/api', 'health') => 'https://x.com/api/health'
 */
export function joinUrl(base: string, endpoint: string): string {
  const safeBase = stripTrailingSlash(base)
  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${safeBase}${safeEndpoint}`
}

/**
 * Resolve API base URL.
 *
 * Priority:
 * - VITE_API_URL (recommended for custom deployments)
 * - "/api" (default, works in dev with Vite proxy and in prod with same-origin)
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    const normalized = stripTrailingSlash(fromEnv.trim())

    // Proteção: nunca usar localhost em build de produção (evita deploy quebrado por env errada)
    const isLocalhostApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/.test(normalized)
    if (isLocalhostApi && import.meta.env.PROD) {
      return '/api'
    }

    return normalized
  }
  return '/api'
}

export function getHealthUrl(): string {
  return joinUrl(getApiBaseUrl(), '/health')
}


