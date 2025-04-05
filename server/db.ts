import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Trebuie setată variabila de mediu DATABASE_URL"
  );
}

// Creează o conexiune PostgreSQL
export const queryClient = postgres(process.env.DATABASE_URL);

// Inițializează Drizzle cu conexiunea PostgreSQL
export const db = drizzle(queryClient);

// O funcție utilă pentru a testa conexiunea
export async function testConnection() {
  try {
    await queryClient`SELECT 1`;
    console.log('Conexiune reușită la baza de date PostgreSQL!');
    return true;
  } catch (error) {
    console.error('Eroare la conectarea la baza de date:', error);
    return false;
  }
}
