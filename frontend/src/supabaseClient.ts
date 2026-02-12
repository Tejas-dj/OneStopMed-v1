// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// 1. Paste your "Project URL" here
const supabaseUrl = 'https://nplxmgrnkhffutppkqrx.supabase.co'

// 2. Paste your "anon public" key here
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbHhtZ3Jua2hmZnV0cHBrcXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDAwOTMsImV4cCI6MjA4NjM3NjA5M30.cb_4X7obyQmIsEXB7e90IpE4u32sT_W9gK07GGXdfL0'

export const supabase = createClient(supabaseUrl, supabaseKey)