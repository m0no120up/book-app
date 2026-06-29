export interface GoogleBooksResult {
  title: string
  authors: string[]
  publisher: string
  published_date: string
  description: string
  thumbnail_url: string
  page_count: number
  isbn: string
}

const PLACEHOLDER_KEY = 'your_google_books_api_key'

function buildUrl(query: string): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
  const validKey = apiKey && apiKey !== PLACEHOLDER_KEY ? apiKey : null
  const base = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
  return validKey ? `${base}&key=${validKey}` : base
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    const msg = body?.error?.message
    if (msg) return msg
  } catch {
    // ignore JSON parse failure
  }

  switch (res.status) {
    case 400: return 'リクエストが不正です（ISBN形式を確認してください）'
    case 403: return 'APIキーが無効か、利用制限に達しています'
    case 429: return 'リクエスト数の上限に達しました。しばらく待ってから再試行してください'
    case 500:
    case 503: return 'Google Books APIサーバーエラーです。しばらく待ってから再試行してください'
    default: return `APIエラー（HTTP ${res.status}）`
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchVolumes(query: string): Promise<any[] | null> {
  const url = buildUrl(query)

  if (process.env.NODE_ENV === 'development') {
    console.log('[GoogleBooks] fetch:', url)
  }

  const res = await fetch(url)

  if (!res.ok) {
    const message = await parseApiError(res)
    throw new Error(message)
  }

  const data = await res.json()

  if (process.env.NODE_ENV === 'development') {
    console.log('[GoogleBooks] response:', data)
  }

  return data.items ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVolumeInfo(volumeInfo: any, fallbackIsbn: string): GoogleBooksResult {
  const isbn13 = volumeInfo.industryIdentifiers?.find((i: { type: string }) => i.type === 'ISBN_13')?.identifier
  const isbn10 = volumeInfo.industryIdentifiers?.find((i: { type: string }) => i.type === 'ISBN_10')?.identifier

  return {
    title: volumeInfo.title ?? '',
    authors: volumeInfo.authors ?? [],
    publisher: volumeInfo.publisher ?? '',
    published_date: volumeInfo.publishedDate ?? '',
    description: volumeInfo.description ?? '',
    thumbnail_url: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') ?? '',
    page_count: volumeInfo.pageCount ?? 0,
    isbn: isbn13 ?? isbn10 ?? fallbackIsbn,
  }
}

export async function fetchBookByISBN(isbn: string): Promise<GoogleBooksResult | null> {
  // First try the isbn: prefix query
  let items = await fetchVolumes(`isbn:${isbn}`)

  // Fallback to plain keyword query (handles books not indexed with isbn: prefix)
  if (!items?.length) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GoogleBooks] isbn: query returned no results, retrying with plain query')
    }
    items = await fetchVolumes(isbn)
  }

  if (!items?.length) return null

  return parseVolumeInfo(items[0].volumeInfo, isbn)
}

export async function fetchBookByTitle(title: string): Promise<GoogleBooksResult[]> {
  const items = await fetchVolumes(title)
  if (!items?.length) return []
  return items.map(item => parseVolumeInfo(item.volumeInfo, ''))
}
