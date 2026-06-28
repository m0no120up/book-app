import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Book, BookInsert } from '@/types'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key || url.startsWith('your_')) {
      throw new Error('Supabaseの環境変数が設定されていません。.env.localを確認してください。')
    }
    _client = createClient(url, key)
  }
  return _client
}

export async function getBooks(status?: string, library?: boolean) {
  let query = getClient().from('books').select('*').order('created_at', { ascending: false })

  if (status === 'library') {
    query = query.eq('is_library', true)
  } else if (status) {
    query = query.eq('status', status)
  }

  if (library !== undefined) {
    query = query.eq('is_library', library)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Book[]
}

export async function addBook(book: BookInsert) {
  const { data, error } = await getClient().from('books').insert(book).select().single()
  if (error) throw error
  return data as Book
}

export async function updateBook(id: string, updates: Partial<BookInsert>) {
  const { data, error } = await getClient().from('books').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Book
}

export async function deleteBook(id: string) {
  const { error } = await getClient().from('books').delete().eq('id', id)
  if (error) throw error
}
