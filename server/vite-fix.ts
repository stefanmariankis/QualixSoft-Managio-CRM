/**
 * Acest fișier servește pentru a asigura compatibilitatea între dezvoltare și producție
 * când aplicația este deploy-uită pe Railway.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obține directorul curent într-un mod compatibil cu ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Determină calea corectă pentru fișierele statice în funcție de mediu
 */
export function getStaticPath(): string {
  // În producție, fișierele statice sunt în dist/public
  if (process.env.NODE_ENV === 'production') {
    const prodPath = path.resolve(__dirname, '../public');
    // Verifică dacă calea există
    if (fs.existsSync(prodPath)) {
      return prodPath;
    }
    // Fallback la calea din dezvoltare
    return path.resolve(__dirname, '../../dist/public');
  }
  
  // În dezvoltare, fișierele statice sunt servite de Vite
  return path.resolve(__dirname, '../client');
}