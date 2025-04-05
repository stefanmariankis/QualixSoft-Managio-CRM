import { db } from "./db";
import { User, InsertUser } from "../shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Inițializăm session store-ul PostgreSQL
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      },
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      // Folosim clientul PostgreSQL direct
      const result = await db`
        SELECT * FROM users
        WHERE id = ${id}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as User;
    } catch (error) {
      console.error("Eroare la obținerea utilizatorului după ID:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Folosim clientul PostgreSQL direct - username este de fapt email în implementarea noastră
      const result = await db`
        SELECT * FROM users
        WHERE email = ${username}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as User;
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
      
      // Inserăm utilizatorul folosind clientul PostgreSQL direct
      const result = await db`
        INSERT INTO users ${db(userData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Utilizatorul a fost creat dar nu a putut fi recuperat");
      }
      
      return result[0] as User;
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
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    
    // Utilizăm un MemoryStore pentru sesiuni (doar pentru dezvoltare/testare)
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Curățare o dată pe zi
    });
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
