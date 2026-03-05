export interface GeoInfo {
  ip: string
  city: string
  country: string
  latitude: number
  longitude: number
}

const CACHE_KEY = 'leviosai_geo_cache'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

let inFlightPromise: Promise<GeoInfo> | null = null

function getCached(): GeoInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts < CACHE_TTL && data.ip) return data
  } catch { /* ignore */ }
  return null
}

function setCache(data: GeoInfo) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* ignore */ }
}

async function fetchFromApis(): Promise<GeoInfo> {
  // API 1: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
    const d = await res.json()
    if (d.ip) {
      return { ip: d.ip, city: d.city || 'Unknown', country: d.country_name || 'Unknown', latitude: d.latitude || 0, longitude: d.longitude || 0 }
    }
  } catch { /* try next */ }

  // API 2: ipwho.is
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) })
    const d = await res.json()
    if (d.ip) {
      return { ip: d.ip, city: d.city || 'Unknown', country: d.country || 'Unknown', latitude: d.latitude || 0, longitude: d.longitude || 0 }
    }
  } catch { /* try next */ }

  // API 3: ip-api.com
  try {
    const res = await fetch('https://ip-api.com/json/?fields=query,city,country,lat,lon', { signal: AbortSignal.timeout(4000) })
    const d = await res.json()
    if (d.query) {
      return { ip: d.query, city: d.city || 'Unknown', country: d.country || 'Unknown', latitude: d.lat || 0, longitude: d.lon || 0 }
    }
  } catch { /* try next */ }

  // Fallback
  return { ip: '127.0.0.1', city: 'Local', country: 'Local', latitude: 37.5665, longitude: 126.978 }
}

/** Shared geo info fetcher with cache + dedup + fallback chain */
export async function getGeoInfo(): Promise<GeoInfo> {
  const cached = getCached()
  if (cached) return cached

  // Deduplicate concurrent calls
  if (!inFlightPromise) {
    inFlightPromise = fetchFromApis().then(info => {
      setCache(info)
      inFlightPromise = null
      return info
    }).catch(() => {
      inFlightPromise = null
      return { ip: '127.0.0.1', city: 'Local', country: 'Local', latitude: 37.5665, longitude: 126.978 }
    })
  }

  return inFlightPromise
}
