import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Lipsesc credențialele Supabase. Asigură-te că ai configurat corect variabilele de mediu SUPABASE_URL și SUPABASE_SERVICE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
