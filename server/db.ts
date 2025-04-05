import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

// Obținem variabilele de mediu pentru configurare
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const connectionString = process.env.DATABASE_URL || '';

// Inițializăm clientul Supabase cu opțiuni pentru resetarea cache-ului de schemă
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  global: {
    headers: {
      'Prefer': 'count=exact',
      'X-Schema-Cache-Control': 'no-cache',
      'X-Client-Info': 'supabase-js-0-0-0' // Forțează resetarea cache-ului
    }
  },
  db: {
    schema: 'public'
  }
});

// Inițializăm și un client postgres pentru query-uri directe SQL dacă este necesar
export const pgClient = postgres(connectionString, {
  max: 5, // număr maxim de conexiuni în pool
  idle_timeout: 20 // timpul de inactivitate în secunde
});

// Definim o funcție pentru a testa conexiunea la baza de date
export async function testConnection() {
  try {
    // Testăm conexiunea la Supabase
    const { data, error } = await supabase.from('users').select('count(*)');
    
    if (error) {
      throw error;
    }
    
    console.log('Conexiune reușită la Supabase PostgreSQL!');
    return true;
  } catch (error) {
    console.error('Eroare la conectarea la baza de date Supabase:', error);
    
    try {
      // Încercăm și conexiunea directă PostgreSQL
      const result = await pgClient`SELECT 1 as test`;
      console.log('Conexiune reușită la PostgreSQL direct!', result);
      return true;
    } catch (pgError) {
      console.error('Eroare la conectarea directă la PostgreSQL:', pgError);
      return false;
    }
  }
}
