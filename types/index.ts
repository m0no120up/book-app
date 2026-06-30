export type BookStatus = 'read' | 'bought' | 'owned' | 'wanted'

export interface Book {
  id: string
  isbn: string | null
  title: string
  authors: string[] | null
  publisher: string | null
  published_date: string | null
  description: string | null
  thumbnail_url: string | null
  page_count: number | null
  status: BookStatus
  is_library: boolean
  memo: string | null
  created_at: string
  updated_at: string
}

export interface BookInsert {
  isbn?: string | null
  title: string
  authors?: string[] | null
  publisher?: string | null
  published_date?: string | null
  description?: string | null
  thumbnail_url?: string | null
  page_count?: number | null
  status: BookStatus
  is_library?: boolean
  memo?: string | null
}

export const STATUS_LABELS: Record<BookStatus, string> = {
  read: '読んだ本',
  bought: '買った本',
  owned: '自宅にある本',
  wanted: '欲しい本',
}

export const STATUS_COLORS: Record<BookStatus, string> = {
  read: 'bg-green-100 text-green-800',
  bought: 'bg-blue-100 text-blue-800',
  owned: 'bg-purple-100 text-purple-800',
  wanted: 'bg-orange-100 text-orange-800',
}

export interface CalilResult {
  found: boolean
  libkey: Record<string, string>
  reserveurl: string | null
  availableBranches: string[]
  unavailableBranches: string[]
}
