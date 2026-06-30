'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Book, BookStatus, STATUS_LABELS } from '@/types'
import { getBooks } from '@/lib/supabase'
import BookCard from './BookCard'

type FilterStatus = BookStatus | 'library' | 'all'

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'read', label: STATUS_LABELS.read },
  { value: 'bought', label: STATUS_LABELS.bought },
  { value: 'owned', label: STATUS_LABELS.owned },
  { value: 'wanted', label: STATUS_LABELS.wanted },
  { value: 'library', label: '図書館' },
]

export default function BookList() {
  const [books, setBooks] = useState<Book[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const statusParam = filter === 'all' ? undefined : filter
      const data = await getBooks(statusParam)
      setBooks(data)
    } catch (e) {
      setError('本の取得に失敗しました。Supabaseの設定を確認してください。')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return books
    return books.filter(book => {
      const titleMatch = book.title.toLowerCase().includes(q)
      const authorMatch = book.authors?.some(a => a.toLowerCase().includes(q)) ?? false
      return titleMatch || authorMatch
    })
  }, [books, searchQuery])

  function handleUpdate(updated: Book) {
    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  function handleDelete(id: string) {
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="タイトル・著者名で検索"
          className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Book count */}
      <p className="text-sm text-gray-500 mt-3 mb-3">
        {loading ? '読み込み中...' : `${filteredBooks.length} 冊`}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && filteredBooks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">
            {searchQuery.trim() ? '検索結果がありません' : '本がありません'}
          </p>
          {!searchQuery.trim() && (
            <Link
              href="/add"
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              本を追加する →
            </Link>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
