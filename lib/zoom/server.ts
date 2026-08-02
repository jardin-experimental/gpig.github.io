// Client Zoom "Server-to-Server OAuth" (app interne, sans redirection utilisateur).
// Nécessite 3 variables d'environnement à créer depuis le Zoom App Marketplace
// (Build App > Server-to-Server OAuth) :
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
// + l'identifiant (ou l'email) du compte Zoom du scientifique qui hébergera
// les réunions :
//   ZOOM_HOST_USER_ID
// Scope requis sur l'app Zoom : meeting:write:admin (ou meeting:write si
// l'app n'est utilisée que pour le compte du scientifique lui-même).

const ZOOM_API_BASE = 'https://api.zoom.us/v2'

let cachedToken: { value: string; expiresAt: number } | null = null

async function getZoomAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }

  const basicAuth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth}` },
    }
  )

  if (!response.ok) {
    throw new Error(`Impossible d'obtenir un token Zoom (${response.status})`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

export type ZoomMeeting = {
  id: number
  join_url: string
  start_url: string
}

// Crée une réunion Zoom programmée d'1h pour le créneau donné.
export async function createZoomMeeting(params: {
  topic: string
  startAtIso: string
  durationMinutes: number
}): Promise<ZoomMeeting> {
  const token = await getZoomAccessToken()

  const response = await fetch(
    `${ZOOM_API_BASE}/users/${process.env.ZOOM_HOST_USER_ID}/meetings`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: params.topic,
        type: 2, // réunion programmée à heure fixe
        start_time: params.startAtIso,
        duration: params.durationMinutes,
        timezone: 'Europe/Paris',
        settings: {
          join_before_host: false,
          waiting_room: true,
          approval_type: 2, // pas d'inscription requise
        },
      }),
    }
  )

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Création de la réunion Zoom impossible : ${detail}`)
  }

  const meeting = await response.json()
  return { id: meeting.id, join_url: meeting.join_url, start_url: meeting.start_url }
}

export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const token = await getZoomAccessToken()

  const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  // 404 = déjà supprimée côté Zoom, on ignore
  if (!response.ok && response.status !== 404) {
    const detail = await response.text()
    throw new Error(`Suppression de la réunion Zoom impossible : ${detail}`)
  }
}
