import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '../config'

const { url, anon } = getSupabaseEnv()

export const supabase = (url && anon) ? createClient(url, anon) : null
