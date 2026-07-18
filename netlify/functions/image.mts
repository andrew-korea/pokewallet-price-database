const BASE = 'https://api.pokewallet.io'

export default async (req: Request) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return new Response('Missing id param', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const apiKey = Netlify.env.get('POKEWALLET_API_KEY')
  const res = await fetch(`${BASE}/images/${encodeURIComponent(id)}`, {
    headers: { 'X-API-Key': apiKey || '' },
  })

  if (!res.ok) {
    return new Response('Image not found', { status: res.status, headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=604800, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
