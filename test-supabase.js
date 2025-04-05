import { createClient } from '@supabase/supabase-js';

// Folosim direct credențialele furnizate
const SUPABASE_URL = 'https://adkufknsilvwybruxvxu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka3Vma25zaWx2d3licnV4dnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTI4NzksImV4cCI6MjA1OTE2ODg3OX0.N-YmhIRHgX4lTLQhcfRf-A7Xvt-Sd18Mxn7ZF-kUUrA';

// Creăm clientul Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const main = async () => {
  console.log('Testăm conexiunea la Supabase...');
  
  try {
    console.log('Verificăm dacă Supabase funcționează...');
    
    // Verificăm ce tabele sunt disponibile
    console.log('1. Verificăm structura tabelei users...');
    
    // Testăm o cerere simplă pentru a verifica conexiunea
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.error('Eroare la accesarea tabelei users:', userError);
      console.log('Mesaj:', userError.message);
      console.log('Cod:', userError.code);
    } else {
      console.log('✅ Conexiunea la Supabase funcționează!');
      console.log('Structura unui user din baza de date:');
      
      if (userData.length > 0) {
        // Afișăm coloanele disponibile
        console.log('Coloane disponibile în tabela users:', Object.keys(userData[0]).join(', '));
      } else {
        console.log('Tabela users există dar nu conține date.');
      }
    }
    
    // Încercăm să creăm o tabelă de test simplă
    console.log('\n2. Încercăm să creăm o nouă tabelă...');
    
    // Numele tabelei va avea un timestamp pentru a evita conflicte
    const testTableName = 'test_' + Date.now().toString().slice(-6);
    
    // Verificăm dacă putem crea tabele noi prin SQL direct
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('create_test_table', { table_name: testTableName });
    
    if (sqlError) {
      console.error('Nu putem crea tabele direct prin SQL:', sqlError.message);
      console.log('Rolul anonim nu are permisiuni suficiente pentru crearea tabelelor.');
    } else {
      console.log(`✅ Am creat tabela ${testTableName} cu succes!`);
      console.log('Rezultat:', sqlResult);
    }
    
    // Încearcă să insereze date într-o tabelă preexistentă (dacă există)
    console.log('\n3. Încercăm să lucrăm cu o tabelă existentă...');
    
    // Verificăm dacă există una din tabelele posibile
    const possibleTables = ['test_public', 'managio_test', 'todos', 'notes'];
    
    for (const tableName of possibleTables) {
      console.log(`Verificăm tabela ${tableName}...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`Tabela ${tableName} nu există.`);
        continue;
      } else if (error) {
        console.log(`Eroare la accesarea tabelei ${tableName}:`, error.message);
        continue;
      }
      
      console.log(`✅ Tabela ${tableName} există!`);
      
      if (data && data.length > 0) {
        console.log(`Date existente:`, data);
        console.log(`Coloane disponibile:`, Object.keys(data[0]).join(', '));
      } else {
        console.log(`Tabela ${tableName} este goală.`);
      }
      
      // Încercăm să inserăm date
      const insertData = { 
        text: `Test entry ${new Date().toISOString()}`, 
        completed: false,
        name: `Test ${new Date().toISOString()}`,
        description: 'Descriere de test',
        content: 'Conținut de test',
        title: 'Titlu de test'
      };
      
      console.log(`Încercăm să inserăm date în ${tableName}...`);
      const { data: insertResult, error: insertError } = await supabase
        .from(tableName)
        .insert([insertData])
        .select();
      
      if (insertError) {
        console.error(`Eroare la inserarea în ${tableName}:`, insertError.message);
        if (insertError.details) console.log('Detalii:', insertError.details);
      } else {
        console.log(`✅ Date inserate cu succes în ${tableName}:`, insertResult);
        break; // Am găsit o tabelă funcțională, oprim bucla
      }
    }
    
  } catch (error) {
    console.error('Eroare neașteptată:', error);
  }
};

main().catch(console.error);