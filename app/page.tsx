import Link from 'next/link'
import BookList from '@/components/BookList'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">📚 本棚</h1>
          <Link
            href="/add"
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
          >
            ＋ 追加
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        <BookList />
      </div>
    </main>
  )
}
