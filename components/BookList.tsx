'use client'

import { useState, useEffect, useCallback } from 'react'
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

  function handleUpdate(updated: Book) {
    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  function handleDelete(id: string) {
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
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
        {loading ? '読み込み中...' : `${books.length} 冊`}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && books.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">本がありません</p>
          <Link
            href="/add"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            本を追加する →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {books.map(book => (
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
