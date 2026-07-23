import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://miqvtfjdeytszzsyaexs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pcXZ0ZmpkZXl0c3p6c3lhZXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzUwMTQsImV4cCI6MjEwMDMxMTAxNH0.mNFlDeUUBVDJxFQUdn8y7N9AH9upXeiwaadTXYTXzZw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)