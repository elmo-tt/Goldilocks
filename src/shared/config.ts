export function getBackend(): 'local' | 'supabase' {
  const v = (import.meta as any).env?.VITE_BACKEND || 'local'
  return v === 'supabase' ? 'supabase' : 'local'
}

export function getSupabaseEnv() {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
  const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
  const bucket = (import.meta as any).env?.VITE_SUPABASE_BUCKET || 'media'
  return { url, anon, bucket }
}
