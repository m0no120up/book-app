'use client'

import { useState } from 'react'
import type { CalilResult } from '@/types'

interface Props {
  isbn: string
  currentIsLibrary?: boolean
  onUpdateLibrary?: (isLibrary: boolean) => Promise<void>
}

export default function LibraryChecker({ isbn, currentIsLibrary, onUpdateLibrary }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CalilResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  async function check() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/calil?isbn=${encodeURIComponent(isbn)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: CalilResult = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '確認に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateLibrary(val: boolean) {
    if (!onUpdateLibrary) return
    setUpdating(true)
    try {
      await onUpdateLibrary(val)
    } finally {
      setUpdating(false)
    }
  }

  const suggestUpdate =
    result !== null &&
    onUpdateLibrary !== undefined &&
    result.found !== currentIsLibrary

  return (
    <div className="mt-1.5">
      <button
        onClick={check}
        disabled={loading}
        className="text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50 flex items-center gap-1"
      >
        {loading ? '確認中...' : '🏛 図書館で確認'}
      </button>

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}

      {result && (
        <div className="mt-0.5 text-xs space-y-0.5">
          {!result.found ? (
            <span className="text-gray-400">横浜市立図書館に蔵書なし</span>
          ) : result.availableBranches.length > 0 ? (
            <span className="text-green-600">
              貸出可 —{' '}
              {result.availableBranches.slice(0, 2).join(' / ')}
              {result.availableBranches.length > 2 ? ' 他' : ''}
            </span>
          ) : (
            <span className="text-orange-500">
              全館貸出中
              {result.reserveurl && (
                <>
                  {' '}
                  <a
                    href={result.reserveurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    予約する
                  </a>
                </>
              )}
            </span>
          )}

          {suggestUpdate && (
            <div>
              <button
                onClick={() => handleUpdateLibrary(result.found)}
                disabled={updating}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                {updating
                  ? '更新中...'
                  : `図書館フラグを「${result.found ? 'あり' : 'なし'}」に更新`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
