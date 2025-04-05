import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Încărcăm variabilele de mediu
dotenv.config();

// Nu folosim direct credențialele aici, le luăm din variabilele de mediu
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Creăm clientul Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const main = async () => {
  console.log('Testăm conexiunea la Supabase...');
  
  try {
    // Mai întâi, facem un test simplu pentru a verifica conexiunea
    const { data: healthCheck, error: healthError } = await supabase.from('_supabase_healthcheck').select('*').limit(1);
    
    if (healthError) {
      console.error('Eroare la verificarea sănătății Supabase:', healthError);
      return;
    }
    
    console.log('Conexiunea la Supabase funcționează!');
    
    // Acum, să verificăm dacă tabela "users" există
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Eroare la listarea tabelelor:', tablesError);
      return;
    }
    
    console.log('Tabele disponibile în schema public:');
    console.log(tablesData.map(t => t.table_name));
    
    // Verificăm dacă există o tabelă specifică, de exemplu "users"
    if (tablesData.some(t => t.table_name === 'users')) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);
      
      if (usersError) {
        console.error('Eroare la interogarea tabelei users:', usersError);
        return;
      }
      
      console.log('Primii 5 utilizatori din baza de date:');
      console.log(JSON.stringify(users, null, 2));
    } else {
      console.log('Tabela "users" nu există încă. Rulează scriptul de migrare pentru a crea schema.');
    }
    
  } catch (error) {
    console.error('Eroare neașteptată:', error);
  }
};

main().catch(console.error);