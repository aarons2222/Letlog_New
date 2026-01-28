import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // During build time, env vars might not be available
  // Return a dummy client that will be replaced at runtime
  if (!url || !key) {
    console.warn('Supabase env vars not available - likely during build')
    // Return a minimal mock for build time
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }
  
  return createBrowserClient(url, key)
}
