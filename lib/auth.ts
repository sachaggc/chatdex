import { cookies } from 'next/headers'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('chatdex_auth')?.value === '1'
}
