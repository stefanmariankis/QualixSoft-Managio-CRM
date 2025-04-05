import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// Configurare conexiune MySQL
const connectionConfig = {
  host: '194.36.143.83',
  port: 3306,
  user: 'premium1_managio_user',
  password: 'QualixSoft2024@',
  database: 'premium1_managio',
};

// Creează pool de conexiuni MySQL
export const poolConnection = mysql.createPool(connectionConfig);

// Inițializează Drizzle cu conexiunea MySQL
export const db = drizzle(poolConnection, { schema });

// O funcție utilă pentru a testa conexiunea
export async function testConnection() {
  try {
    const [rows] = await poolConnection.execute('SELECT 1');
    console.log('Conexiune reușită la baza de date MySQL!');
    return true;
  } catch (error) {
    console.error('Eroare la conectarea la baza de date:', error);
    return false;
  }
}
