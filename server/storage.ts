import { supabase, pgClient } from "./db";
import { User, InsertUser } from "../shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Folosim Supabase direct
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data as User;
    } catch (error) {
      console.error("Eroare la obținerea utilizatorului după ID:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Folosim Supabase direct - username este de fapt email în implementarea noastră
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', username)
        .single();
        
      if (error && error.code !== 'PGRST116') { // Codul pentru "no rows returned"
        throw error;
      }
      
      return data as User;
    } catch (error) {
      console.error("Eroare la obținerea utilizatorului după email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Mapăm proprietățile pentru a se potrivi cu denumirile coloanelor din baza de date
      const userData = {
        email: insertUser.email,
        password: insertUser.password,
        first_name: insertUser.firstName ?? null,
        last_name: insertUser.lastName ?? null,
        role: insertUser.role ?? 'ceo',
        organization_id: insertUser.organizationId ?? null
      };
      
      // Folosim Supabase direct
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error("Utilizatorul a fost creat dar nu a putut fi recuperat");
      }
      
      return data as User;
    } catch (error: any) {
      console.error("Eroare la crearea utilizatorului:", error);
      throw new Error(`Nu s-a putut crea utilizatorul: ${error.message || 'Eroare necunoscută'}`);
    }
  }
}

// MemStorage implementare ca backup sau pentru testare
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    
    // Creăm utilizatorul asigurându-ne că toate câmpurile au valorile corecte
    const user: User = { 
      id, 
      email: insertUser.email,
      password: insertUser.password,
      first_name: insertUser.firstName ?? null,
      last_name: insertUser.lastName ?? null,
      role: insertUser.role ?? 'ceo',
      organization_id: insertUser.organizationId ?? null,
      created_at: now,
      updated_at: now
    };
    
    this.users.set(id, user);
    return user;
  }
}

// Folosim DatabaseStorage pentru conectarea la PostgreSQL
export const storage = new DatabaseStorage();
