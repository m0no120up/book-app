import { createClient } from '@supabase/supabase-js'
import type { Book, BookInsert } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getBooks(status?: string, library?: boolean) {
  let query = supabase.from('books').select('*').order('created_at', { ascending: false })

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
  const { data, error } = await supabase.from('books').insert(book).select().single()
  if (error) throw error
  return data as Book
}

export async function updateBook(id: string, updates: Partial<BookInsert>) {
  const { data, error } = await supabase.from('books').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Book
}

export async function deleteBook(id: string) {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}
