import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (val) => {
  return !val || val.includes("your-project-id") || val.includes("your-supabase-anon");
};

// Initialize Supabase client if environment variables are set and not placeholders
export const supabase = (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (supabase) {
  console.log("React Status: Supabase Cloud client initialized successfully.");
} else {
  console.log("React Status: running in OFFLINE mode (using compiled JSON caches).");
}
