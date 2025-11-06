export function getBackend(): 'local' | 'supabase' {
  const env = (import.meta as any).env || {}
  const raw = String(env?.VITE_BACKEND ?? '').trim().toLowerCase()
  const supaFlag = ['supabase', '1', 'true', 'yes', 'on'].includes(raw)
  const hasCreds = !!(String(env?.VITE_SUPABASE_URL || '').trim() && String(env?.VITE_SUPABASE_ANON_KEY || '').trim())
  // Prefer explicit flag; otherwise auto-detect when Supabase creds are present
  return (supaFlag || (!raw && hasCreds)) ? 'supabase' : 'local'
}

export function getSupabaseEnv() {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
  const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''
  const bucket = (import.meta as any).env?.VITE_SUPABASE_BUCKET || 'media'
  return { url, anon, bucket }
}
