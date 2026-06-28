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

export async function fetchBookByISBN(isbn: string): Promise<GoogleBooksResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`

  const res = await fetch(url)
  if (!res.ok) return null

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
