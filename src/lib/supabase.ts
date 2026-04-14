import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lrvrkbyakrxrtupbrxpv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydnJrYnlha3J4cnR1cGJyeHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzMwODQsImV4cCI6MjA5MTc0OTA4NH0.thsxSR_AUj9dHz7_MSLrNXwb-AWeZKJ7RwHUQYfxUmM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
