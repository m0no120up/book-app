'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Book, BookStatus, STATUS_LABELS } from '@/types'
import StatusBadge from './StatusBadge'
import { updateBook, deleteBook } from '@/lib/supabase'
import LibraryChecker from './LibraryChecker'

interface Props {
  book: Book
  onUpdate: (book: Book) => void
  onDelete: (id: string) => void
}

export default function BookCard({ book, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState<BookStatus>(book.status)
  const [isLibrary, setIsLibrary] = useState(book.is_library)
  const [memo, setMemo] = useState(book.memo ?? '')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateBook(book.id, { status, is_library: isLibrary, memo })
      onUpdate(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`「${book.title}」を削除しますか？`)) return
    await deleteBook(book.id)
    onDelete(book.id)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex gap-3">
      {book.thumbnail_url ? (
        <div className="flex-shrink-0 w-16 h-24 relative">
          <Image
            src={book.thumbnail_url}
            alt={book.title}
            fill
            className="object-cover rounded"
            sizes="64px"
          />
        </div>
      ) : (
        <div className="flex-shrink-0 w-16 h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs text-center">
          表紙なし
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight text-gray-900 line-clamp-2">{book.title}</h3>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs text-blue-600 hover:text-blue-800 px-1"
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-700 px-1"
            >
              削除
            </button>
          </div>
        </div>

        {book.authors?.length ? (
          <p className="text-xs text-gray-500 mt-0.5">{book.authors.join(', ')}</p>
        ) : null}
        {book.publisher && (
          <p className="text-xs text-gray-400">{book.publisher}</p>
        )}

        <div className="mt-1.5">
          <StatusBadge status={book.status} isLibrary={book.is_library} />
        </div>

        {!editing && (
          <LibraryChecker
            isbn={book.isbn}
            currentIsLibrary={isLibrary}
            onUpdateLibrary={async (val) => {
              const updated = await updateBook(book.id, { is_library: val })
              setIsLibrary(val)
              onUpdate(updated)
            }}
          />
        )}

        {book.memo && !editing && (
          <p className="text-xs text-gray-600 mt-1 italic">{book.memo}</p>
        )}

        {book.description && !editing && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1"
          >
            {expanded ? '▲ 説明を隠す' : '▼ 説明を見る'}
          </button>
        )}
        {expanded && book.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-4">{book.description}</p>
        )}

        {editing && (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-700">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                className="mt-0.5 block w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                {(Object.entries(STATUS_LABELS) as [BookStatus, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isLibrary}
                onChange={(e) => setIsLibrary(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-700">図書館にある</span>
            </label>
            <div>
              <label className="text-xs font-medium text-gray-700">メモ</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                className="mt-0.5 block w-full text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="メモを入力..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 text-sm bg-blue-600 text-white rounded py-1 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 text-sm border border-gray-300 rounded py-1 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
