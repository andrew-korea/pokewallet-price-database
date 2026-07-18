const BASE = 'https://api.pokewallet.io'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' }
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' }

export async function onRequestGet({ env }) {
  const cacheKey = 'sets'
  const cached = await env.POKEWALLET_CACHE.get(cacheKey, { type: 'json' })
  if (cached && Date.now() - cached.timestamp < TTL_MS) {
    return Response.json(cached.data, { headers: CACHE_HEADERS })
  }

  const res = await fetch(`${BASE}/sets`, {
    headers: { 'X-API-Key': env.POKEWALLET_API_KEY || '' },
  })
  const data = await res.json()

  if (res.ok) {
    await env.POKEWALLET_CACHE.put(cacheKey, JSON.stringify({ timestamp: Date.now(), data }), {
      expirationTtl: 86400,
    })
    return Response.json(data, { headers: CACHE_HEADERS })
  }

  return Response.json(data, { status: res.status, headers: CORS_HEADERS })
}
// secret-persistence verification 2026-07-18T13:59:25Z
