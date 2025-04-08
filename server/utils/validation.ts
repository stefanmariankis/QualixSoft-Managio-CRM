/**
 * Utilitare pentru validarea datelor
 */
import { ZodError } from 'zod';

/**
 * Convertește erorile de la Zod într-un string ușor de citit
 */
export function zodErrorsToString(error: ZodError): string {
  return error.errors
    .map((err) => {
      return `${err.path.join('.')}: ${err.message}`;
    })
    .join(', ');
}