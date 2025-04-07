/**
 * Export centralizat al tuturor tipurilor definite în aplicație
 */

// Export tipuri de bază din fiecare modul
export * from './common.types';
export * from './user.types';
export * from './invoice.types';

// TODO: Completează cu celelalte fișiere de tipuri după ce sunt create:
// export * from './organization.types';
// export * from './project.types'; 
// export * from './client.types';
// export * from './task.types';
// export * from './team.types';
// export * from './department.types';
// export * from './automation.types';
// export * from './activity.types';

// Starea de autentificare
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

// Starea organizației
export interface OrganizationState {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
}

// Adaugă aici alte tipuri de stare necesare în aplicație