// Vercel Serverless Function — NEIS API CORS proxy
export default async function handler(req, res) {
  const apiKey = process.env.NEIS_API_KEY || req.query.KEY || ''

  const params = new URLSearchParams(req.query)
  params.set('Type', 'json')
  if (apiKey) params.set('KEY', apiKey)
  // Remove KEY from forwarded query if it came from client (use server-side key instead)
  if (process.env.NEIS_API_KEY) params.delete('KEY')

  const url = `https://open.neis.go.kr/hub/acaInsTiInfo?${params.toString()}`

  try {
    const upstream = await fetch(url)
    const data = await upstream.json()

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json(data)
  } catch (err) {
    res.status(502).json({ error: 'upstream fetch failed', detail: String(err) })
  }
}
