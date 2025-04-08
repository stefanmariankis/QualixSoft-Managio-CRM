import postgres from 'postgres';
import 'dotenv/config';

// Obținem variabila de mediu pentru conexiune
const connectionString = process.env.DATABASE_URL || '';

// Inițializăm clientul postgres pentru acces direct la baza de date
export const db = postgres(connectionString, {
  max: 10, // număr maxim de conexiuni în pool
  idle_timeout: 30, // timpul de inactivitate în secunde
  connect_timeout: 10, // timeout în secunde pentru conectare
});

// Creem un client specializat pentru migrări cu timp de expirare mai lung
export const migrationDb = postgres(connectionString, {
  max: 1,
  idle_timeout: 60,
  connect_timeout: 30,
  // postgres-js nu acceptă direct un query_timeout ca proprietate
  // așa că îl omitem și, dacă este necesar, îl gestionăm cu promises
});

// Definim o funcție pentru a testa conexiunea la baza de date
export async function testConnection() {
  try {
    // Testăm conexiunea directă PostgreSQL
    const result = await db`SELECT 1 as test`;
    console.log('Conexiune reușită la PostgreSQL!', result);
    return true;
  } catch (error) {
    console.error('Eroare la conectarea la baza de date PostgreSQL:', error);
    return false;
  }
}

// Funcție pentru a verifica existența unei tabele
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ) as exists;
    `;
    return result[0]?.exists === true;
  } catch (error) {
    console.error(`Eroare la verificarea existenței tabelei ${tableName}:`, error);
    return false;
  }
}

// Funcție pentru a verifica existența unui enum
export async function enumExists(enumName: string): Promise<boolean> {
  try {
    const result = await db`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = ${enumName}
      ) as exists;
    `;
    return result[0]?.exists === true;
  } catch (error) {
    console.error(`Eroare la verificarea existenței enum-ului ${enumName}:`, error);
    return false;
  }
}

// Exportăm și o referință veche pentru compatibilitate cu codul existent
export const pgClient = db;
