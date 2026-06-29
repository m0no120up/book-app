'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BookStatus, STATUS_LABELS } from '@/types'
import { addBook } from '@/lib/supabase'
import { fetchBookByISBN, fetchBookByTitle, GoogleBooksResult } from '@/lib/google-books'
import BarcodeScanner from '@/components/BarcodeScanner'

interface BookForm {
  isbn: string
  title: string
  authors: string
  publisher: string
  published_date: string
  description: string
  thumbnail_url: string
  page_count: string
  status: BookStatus
  is_library: boolean
  memo: string
}

const DEFAULT_FORM: BookForm = {
  isbn: '',
  title: '',
  authors: '',
  publisher: '',
  published_date: '',
  description: '',
  thumbnail_url: '',
  page_count: '',
  status: 'wanted',
  is_library: false,
  memo: '',
}

export default function AddPage() {
  const router = useRouter()
  const [form, setForm] = useState<BookForm>(DEFAULT_FORM)
  const [scanning, setScanning] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [manualIsbn, setManualIsbn] = useState('')
  const [titleQuery, setTitleQuery] = useState('')
  const [titleResults, setTitleResults] = useState<GoogleBooksResult[]>([])
  const [titleSearching, setTitleSearching] = useState(false)

  function applyBookResult(result: GoogleBooksResult) {
    setForm(prev => ({
      ...prev,
      isbn: result.isbn,
      title: result.title,
      authors: result.authors.join(', '),
      publisher: result.publisher,
      published_date: result.published_date,
      description: result.description,
      thumbnail_url: result.thumbnail_url,
      page_count: result.page_count ? String(result.page_count) : '',
    }))
    setTitleResults([])
    setTitleQuery('')
  }

  const handleIsbnDetected = useCallback(async (isbn: string) => {
    setScanning(false)
    setFetching(true)
    setFetchError(null)
    setTitleResults([])
    try {
      const result = await fetchBookByISBN(isbn)
      if (result) {
        applyBookResult(result)
      } else {
        setFetchError(`ISBN ${isbn} の本が見つかりませんでした。タイトルで検索してください。`)
        setForm(prev => ({ ...prev, isbn }))
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : '本の情報取得に失敗しました。'
      setFetchError(`情報取得エラー: ${message}`)
    } finally {
      setFetching(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTitleSearch() {
    if (!titleQuery.trim()) return
    setTitleSearching(true)
    setTitleResults([])
    try {
      const results = await fetchBookByTitle(titleQuery.trim())
      setTitleResults(results)
      if (!results.length) setFetchError('タイトル検索でも本が見つかりませんでした。')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'タイトル検索に失敗しました。'
      setFetchError(`検索エラー: ${message}`)
    } finally {
      setTitleSearching(false)
    }
  }

  async function handleManualIsbn() {
    if (!manualIsbn.trim()) return
    await handleIsbnDetected(manualIsbn.trim())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return

    setSaving(true)
    try {
      await addBook({
        isbn: form.isbn || null,
        title: form.title,
        authors: form.authors ? form.authors.split(',').map(a => a.trim()).filter(Boolean) : null,
        publisher: form.publisher || null,
        published_date: form.published_date || null,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
        page_count: form.page_count ? Number(form.page_count) : null,
        status: form.status,
        is_library: form.is_library,
        memo: form.memo || null,
      })
      router.push('/')
    } catch (e) {
      console.error(e)
      alert('保存に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  function set(field: keyof BookForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 戻る
          </button>
          <h1 className="text-lg font-bold text-gray-900">本を追加</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Scanner section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3">ISBNで検索</h2>
          <button
            onClick={() => setScanning(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            📷 バーコードをスキャン
          </button>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              placeholder="ISBNを手動入力（例：9784...）"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleManualIsbn()}
            />
            <button
              onClick={handleManualIsbn}
              disabled={fetching}
              className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              検索
            </button>
          </div>
          {fetching && (
            <p className="text-sm text-blue-600 mt-2 text-center">本の情報を取得中...</p>
          )}
          {fetchError && (
            <p className="text-sm text-red-600 mt-2">{fetchError}</p>
          )}

          {/* Title search fallback — shown when ISBN lookup returned no results */}
          {fetchError && !fetching && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">タイトルで検索</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  placeholder="本のタイトルを入力..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSearch()}
                />
                <button
                  onClick={handleTitleSearch}
                  disabled={titleSearching}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {titleSearching ? '…' : '検索'}
                </button>
              </div>
              {titleResults.length > 0 && (
                <ul className="mt-2 border border-gray-200 rounded divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {titleResults.map((book, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => applyBookResult(book)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm"
                      >
                        <span className="font-medium">{book.title}</span>
                        {book.authors.length > 0 && (
                          <span className="text-gray-500 ml-1">— {book.authors[0]}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Book preview */}
        {form.thumbnail_url && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3">
            <Image
              src={form.thumbnail_url}
              alt={form.title}
              width={64}
              height={96}
              className="object-cover rounded"
            />
            <div>
              <p className="font-medium text-sm">{form.title}</p>
              {form.authors && <p className="text-xs text-gray-500 mt-0.5">{form.authors}</p>}
              {form.publisher && <p className="text-xs text-gray-400">{form.publisher}</p>}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="本のタイトル"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">著者</label>
            <input
              type="text"
              value={form.authors}
              onChange={(e) => set('authors', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="著者名（複数はカンマ区切り）"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as BookStatus)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {(Object.entries(STATUS_LABELS) as [BookStatus, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_library}
              onChange={(e) => set('is_library', e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700">図書館にある</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              value={form.memo}
              onChange={(e) => set('memo', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="任意のメモ..."
            />
          </div>

          {/* Advanced fields (collapsed by default when auto-filled) */}
          <details className="text-sm">
            <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
              詳細情報を編集
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ISBN</label>
                <input
                  type="text"
                  value={form.isbn}
                  onChange={(e) => set('isbn', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">出版社</label>
                <input
                  type="text"
                  value={form.publisher}
                  onChange={(e) => set('publisher', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">出版日</label>
                <input
                  type="text"
                  value={form.published_date}
                  onChange={(e) => set('published_date', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">表紙URL</label>
                <input
                  type="url"
                  value={form.thumbnail_url}
                  onChange={(e) => set('thumbnail_url', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </details>

          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '本を追加する'}
          </button>
        </form>
      </div>

      {scanning && (
        <BarcodeScanner
          onDetected={handleIsbnDetected}
          onClose={() => setScanning(false)}
        />
      )}
    </main>
  )
}
