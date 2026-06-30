import type { CalilResult } from '@/types'

const SYSTEM_ID = 'Yokohama_City'
const CALIL_API = 'https://api.calil.jp/check'
const MAX_POLLS = 10
const POLL_INTERVAL_MS = 1500

interface CalilApiResponse {
  session: string
  books: {
    [isbn: string]: {
      [systemId: string]: {
        status: 'OK' | 'Running' | 'Error'
        libkey: Record<string, string>
        reserveurl: string
      }
    }
  }
  continue: 0 | 1
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function checkCalil(isbn: string): Promise<CalilResult> {
  const appkey = process.env.CALIL_APP_KEY
  if (!appkey) throw new Error('CALIL_APP_KEY is not set')

  const params = new URLSearchParams({ appkey, isbn, systemid: SYSTEM_ID, format: 'json', callback: 'no' })
  let res = await fetch(`${CALIL_API}?${params}`)
  if (!res.ok) throw new Error(`Calil API error: ${res.status}`)
  let data: CalilApiResponse = await res.json()

  let polls = 0
  while (data.continue === 1 && polls < MAX_POLLS) {
    await sleep(POLL_INTERVAL_MS)
    const pollParams = new URLSearchParams({ appkey, session: data.session, format: 'json', callback: 'no' })
    res = await fetch(`${CALIL_API}?${pollParams}`)
    if (!res.ok) throw new Error(`Calil API poll error: ${res.status}`)
    data = await res.json()
    polls++
  }

  const bookData = data.books[isbn]?.[SYSTEM_ID]
  if (!bookData || bookData.status === 'Error') {
    return { found: false, libkey: {}, reserveurl: null, availableBranches: [], unavailableBranches: [] }
  }

  const libkey = bookData.libkey ?? {}
  const entries = Object.entries(libkey).filter(([, v]) => v !== '')
  const availableBranches = entries.filter(([, v]) => v === '蔵書あり').map(([k]) => k)
  const unavailableBranches = entries.filter(([, v]) => v !== '蔵書あり').map(([k]) => k)

  return {
    found: entries.length > 0,
    libkey,
    reserveurl: bookData.reserveurl || null,
    availableBranches,
    unavailableBranches,
  }
}
