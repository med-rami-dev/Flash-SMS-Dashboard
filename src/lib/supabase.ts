
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// This is a placeholder; you'll need to replace these with your actual Supabase project details
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
