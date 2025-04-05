import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const users_result = await db.select().from(users).where(eq(users.id, id));
      return users_result[0];
    } catch (error) {
      console.error("Error fetching user by id:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Înlocuim username cu email în această implementare, deoarece email este câmpul unic
      const users_result = await db.select().from(users).where(eq(users.email, username));
      return users_result[0];
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // În PostgreSQL putem folosi metoda returning() pentru a primi utilizatorul creat
      const userData = {
        ...insertUser,
        // Setăm valori implicite pentru câmpurile care lipsesc
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        role: insertUser.role || 'ceo',
        organizationId: insertUser.organizationId || null
      };
      
      const newUsers = await db.insert(users).values(userData).returning();
      const newUser = newUsers[0];
      
      if (!newUser) {
        throw new Error("Utilizatorul a fost creat dar nu a putut fi recuperat");
      }
      
      return newUser;
    } catch (error: any) {
      console.error("Error creating user:", error);
      throw new Error(`Failed to create user: ${error.message || 'Unknown error'}`);
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
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      updatedAt: now,
      // Setăm valori implicite pentru câmpurile care lipsesc
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      role: insertUser.role || 'ceo',
      organizationId: insertUser.organizationId || null
    };
    this.users.set(id, user);
    return user;
  }
}

// Schimbă între DatabaseStorage și MemStorage în funcție de necesități
// Vom folosi DatabaseStorage pentru conectarea la MySQL
export const storage = new DatabaseStorage();
