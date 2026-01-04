import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ijhcwqwxtijkpzrrxfgd.supabase.co'
const supabaseAnonKey = 'sb_publishable_fZQm_xQg-OioVziuA8VbXQ_P5Nk-yn8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)