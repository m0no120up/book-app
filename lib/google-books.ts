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

function buildUrl(isbn: string): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
  const validKey = apiKey && apiKey !== PLACEHOLDER_KEY ? apiKey : null
  const base = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
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

export async function fetchBookByISBN(isbn: string): Promise<GoogleBooksResult | null> {
  const url = buildUrl(isbn)
  const res = await fetch(url)

  if (!res.ok) {
    const message = await parseApiError(res)
    throw new Error(message)
  }

  const data = await res.json()
  if (!data.items?.length) return null

  const info = data.items[0].volumeInfo
  const isbn13 = info.industryIdentifiers?.find((i: { type: string }) => i.type === 'ISBN_13')?.identifier
  const isbn10 = info.industryIdentifiers?.find((i: { type: string }) => i.type === 'ISBN_10')?.identifier

  return {
    title: info.title ?? '',
    authors: info.authors ?? [],
    publisher: info.publisher ?? '',
    published_date: info.publishedDate ?? '',
    description: info.description ?? '',
    thumbnail_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') ?? '',
    page_count: info.pageCount ?? 0,
    isbn: isbn13 ?? isbn10 ?? isbn,
  }
}
