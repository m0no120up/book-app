import { type NextRequest } from 'next/server'
import { checkCalil } from '@/lib/calil'

export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get('isbn')
  if (!isbn) {
    return Response.json({ error: 'isbn is required' }, { status: 400 })
  }

  try {
    const result = await checkCalil(isbn)
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
