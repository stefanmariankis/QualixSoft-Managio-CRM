import { db } from "./db";
import { 
  User, InsertUser, 
  Organization, InsertOrganization,
  Client, InsertClient,
  Project, InsertProject,
  Task, InsertTask,
  Invoice, InsertInvoice,
  TimeLog, InsertTimeLog,
  ActivityLog, InsertActivityLog
} from "../shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUsersByOrganization(organizationId: number): Promise<User[]>;
  
  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organizationData: Partial<Organization>): Promise<Organization | undefined>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientsByOrganization(organizationId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByOrganization(organizationId: number): Promise<Project[]>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  getTasksByOrganization(organizationId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByOrganization(organizationId: number): Promise<Invoice[]>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoicesByProject(projectId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // TimeLog operations
  getTimeLog(id: number): Promise<TimeLog | undefined>;
  getTimeLogsByProject(projectId: number): Promise<TimeLog[]>;
  getTimeLogsByUser(userId: number): Promise<TimeLog[]>;
  getTimeLogsByTask(taskId: number): Promise<TimeLog[]>;
  createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog>;
  updateTimeLog(id: number, timeLogData: Partial<TimeLog>): Promise<TimeLog | undefined>;
  deleteTimeLog(id: number): Promise<boolean>;
  
  // ActivityLog operations
  getActivityLogsByOrganization(organizationId: number, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByEntity(entityType: string, entityId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
  
  // Session store
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

  // User operations
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
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      if (Object.keys(userData).length === 0) {
        return await this.getUser(id);
      }
      
      const result = await db`
        UPDATE users
        SET ${db(userData)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as User;
    } catch (error) {
      console.error("Eroare la actualizarea utilizatorului:", error);
      return undefined;
    }
  }
  
  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    try {
      const result = await db`
        SELECT * FROM users
        WHERE organization_id = ${organizationId}
        ORDER BY first_name, last_name
      `;
      
      return result as unknown as User[];
    } catch (error) {
      console.error("Eroare la obținerea utilizatorilor organizației:", error);
      return [];
    }
  }
  
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    try {
      const result = await db`
        SELECT * FROM organizations
        WHERE id = ${id}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Organization;
    } catch (error) {
      console.error("Eroare la obținerea organizației:", error);
      return undefined;
    }
  }
  
  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    try {
      const result = await db`
        SELECT * FROM organizations
        WHERE slug = ${slug}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Organization;
    } catch (error) {
      console.error("Eroare la obținerea organizației după slug:", error);
      return undefined;
    }
  }
  
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    try {
      const now = new Date();
      const orgData = {
        ...organization,
        subscription_plan: organization.subscription_plan ?? 'trial',
        is_active: organization.is_active ?? true,
        created_at: now,
        updated_at: now
      };
      
      const result = await db`
        INSERT INTO organizations ${db(orgData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Organizația a fost creată dar nu a putut fi recuperată");
      }
      
      return result[0] as Organization;
    } catch (error: any) {
      console.error("Eroare la crearea organizației:", error);
      throw new Error(`Nu s-a putut crea organizația: ${error.message || 'Eroare necunoscută'}`);
    }
  }
  
  async updateOrganization(id: number, organizationData: Partial<Organization>): Promise<Organization | undefined> {
    try {
      if (Object.keys(organizationData).length === 0) {
        return await this.getOrganization(id);
      }
      
      const updatedData = {
        ...organizationData,
        updated_at: new Date()
      };
      
      const result = await db`
        UPDATE organizations
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Organization;
    } catch (error) {
      console.error("Eroare la actualizarea organizației:", error);
      return undefined;
    }
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    try {
      const result = await db`
        SELECT * FROM clients
        WHERE id = ${id}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Client;
    } catch (error) {
      console.error("Eroare la obținerea clientului:", error);
      return undefined;
    }
  }
  
  async getClientsByOrganization(organizationId: number): Promise<Client[]> {
    try {
      const result = await db`
        SELECT * FROM clients
        WHERE organization_id = ${organizationId}
        ORDER BY name
      `;
      
      return result as unknown as Client[];
    } catch (error) {
      console.error("Eroare la obținerea clienților organizației:", error);
      return [];
    }
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    try {
      const now = new Date();
      const clientData = {
        ...client,
        created_at: now,
        updated_at: now
      };
      
      const result = await db`
        INSERT INTO clients ${db(clientData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Clientul a fost creat dar nu a putut fi recuperat");
      }
      
      return result[0] as Client;
    } catch (error: any) {
      console.error("Eroare la crearea clientului:", error);
      throw new Error(`Nu s-a putut crea clientul: ${error.message || 'Eroare necunoscută'}`);
    }
  }
  
  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    try {
      if (Object.keys(clientData).length === 0) {
        return await this.getClient(id);
      }
      
      const updatedData = {
        ...clientData,
        updated_at: new Date()
      };
      
      const result = await db`
        UPDATE clients
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Client;
    } catch (error) {
      console.error("Eroare la actualizarea clientului:", error);
      return undefined;
    }
  }
  
  async deleteClient(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM clients
        WHERE id = ${id}
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea clientului:", error);
      return false;
    }
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    try {
      const result = await db`
        SELECT * FROM projects
        WHERE id = ${id}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Project;
    } catch (error) {
      console.error("Eroare la obținerea proiectului:", error);
      return undefined;
    }
  }
  
  async getProjectsByOrganization(organizationId: number): Promise<Project[]> {
    try {
      const result = await db`
        SELECT * FROM projects
        WHERE organization_id = ${organizationId}
        ORDER BY start_date DESC, name
      `;
      
      return result as unknown as Project[];
    } catch (error) {
      console.error("Eroare la obținerea proiectelor organizației:", error);
      return [];
    }
  }
  
  async getProjectsByClient(clientId: number): Promise<Project[]> {
    try {
      const result = await db`
        SELECT * FROM projects
        WHERE client_id = ${clientId}
        ORDER BY start_date DESC, name
      `;
      
      return result as unknown as Project[];
    } catch (error) {
      console.error("Eroare la obținerea proiectelor clientului:", error);
      return [];
    }
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    try {
      const now = new Date();
      const projectData = {
        ...project,
        completion_percentage: project.completion_percentage ?? 0,
        created_at: now,
        updated_at: now
      };
      
      const result = await db`
        INSERT INTO projects ${db(projectData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Proiectul a fost creat dar nu a putut fi recuperat");
      }
      
      return result[0] as Project;
    } catch (error: any) {
      console.error("Eroare la crearea proiectului:", error);
      throw new Error(`Nu s-a putut crea proiectul: ${error.message || 'Eroare necunoscută'}`);
    }
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    try {
      if (Object.keys(projectData).length === 0) {
        return await this.getProject(id);
      }
      
      const updatedData = {
        ...projectData,
        updated_at: new Date()
      };
      
      const result = await db`
        UPDATE projects
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Project;
    } catch (error) {
      console.error("Eroare la actualizarea proiectului:", error);
      return undefined;
    }
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      // Ar trebui să verificăm dacă există task-uri sau facturi asociate
      const result = await db`
        DELETE FROM projects
        WHERE id = ${id}
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea proiectului:", error);
      return false;
    }
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    try {
      const result = await db`
        SELECT * FROM tasks
        WHERE id = ${id}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Task;
    } catch (error) {
      console.error("Eroare la obținerea task-ului:", error);
      return undefined;
    }
  }
  
  async getTasksByProject(projectId: number): Promise<Task[]> {
    try {
      const result = await db`
        SELECT * FROM tasks
        WHERE project_id = ${projectId}
        ORDER BY due_date ASC NULLS LAST, priority DESC, title
      `;
      
      return result as unknown as Task[];
    } catch (error) {
      console.error("Eroare la obținerea task-urilor proiectului:", error);
      return [];
    }
  }
  
  async getTasksByUser(userId: number): Promise<Task[]> {
    try {
      const result = await db`
        SELECT * FROM tasks
        WHERE assigned_to = ${userId}
        ORDER BY due_date ASC NULLS LAST, priority DESC, title
      `;
      
      return result as unknown as Task[];
    } catch (error) {
      console.error("Eroare la obținerea task-urilor utilizatorului:", error);
      return [];
    }
  }
  
  async getTasksByOrganization(organizationId: number): Promise<Task[]> {
    try {
      const result = await db`
        SELECT * FROM tasks
        WHERE organization_id = ${organizationId}
        ORDER BY due_date ASC NULLS LAST, priority DESC, title
      `;
      
      return result as unknown as Task[];
    } catch (error) {
      console.error("Eroare la obținerea task-urilor organizației:", error);
      return [];
    }
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    try {
      const now = new Date();
      const taskData = {
        ...task,
        completion_percentage: task.completion_percentage ?? 0,
        created_at: now,
        updated_at: now
      };
      
      const result = await db`
        INSERT INTO tasks ${db(taskData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Task-ul a fost creat dar nu a putut fi recuperat");
      }
      
      return result[0] as Task;
    } catch (error: any) {
      console.error("Eroare la crearea task-ului:", error);
      throw new Error(`Nu s-a putut crea task-ul: ${error.message || 'Eroare necunoscută'}`);
    }
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    try {
      if (Object.keys(taskData).length === 0) {
        return await this.getTask(id);
      }
      
      const updatedData = {
        ...taskData,
        updated_at: new Date()
      };
      
      const result = await db`
        UPDATE tasks
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Task;
    } catch (error) {
      console.error("Eroare la actualizarea task-ului:", error);
      return undefined;
    }
  }
  
  async deleteTask(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM tasks
        WHERE id = ${id}
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea task-ului:", error);
      return false;
    }
  }
  
  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const result = await db`
        SELECT * FROM invoices
        WHERE id = ${id}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Invoice;
    } catch (error) {
      console.error("Eroare la obținerea facturii:", error);
      return undefined;
    }
  }
  
  async getInvoicesByOrganization(organizationId: number): Promise<Invoice[]> {
    try {
      const result = await db`
        SELECT * FROM invoices
        WHERE organization_id = ${organizationId}
        ORDER BY issue_date DESC, due_date ASC
      `;
      
      return result as unknown as Invoice[];
    } catch (error) {
      console.error("Eroare la obținerea facturilor organizației:", error);
      return [];
    }
  }
  
  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    try {
      const result = await db`
        SELECT * FROM invoices
        WHERE client_id = ${clientId}
        ORDER BY issue_date DESC, due_date ASC
      `;
      
      return result as unknown as Invoice[];
    } catch (error) {
      console.error("Eroare la obținerea facturilor clientului:", error);
      return [];
    }
  }
  
  async getInvoicesByProject(projectId: number): Promise<Invoice[]> {
    try {
      const result = await db`
        SELECT * FROM invoices
        WHERE project_id = ${projectId}
        ORDER BY issue_date DESC, due_date ASC
      `;
      
      return result as unknown as Invoice[];
    } catch (error) {
      console.error("Eroare la obținerea facturilor proiectului:", error);
      return [];
    }
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const now = new Date();
      const invoiceData = {
        ...invoice,
        paid_amount: invoice.paid_amount ?? 0,
        remaining_amount: invoice.remaining_amount ?? invoice.total_amount,
        created_at: now,
        updated_at: now
      };
      
      const result = await db`
        INSERT INTO invoices ${db(invoiceData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Factura a fost creată dar nu a putut fi recuperată");
      }
      
      return result[0] as Invoice;
    } catch (error: any) {
      console.error("Eroare la crearea facturii:", error);
      throw new Error(`Nu s-a putut crea factura: ${error.message || 'Eroare necunoscută'}`);
    }
  }
  
  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      if (Object.keys(invoiceData).length === 0) {
        return await this.getInvoice(id);
      }
      
      const updatedData = {
        ...invoiceData,
        updated_at: new Date()
      };
      
      const result = await db`
        UPDATE invoices
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as Invoice;
    } catch (error) {
      console.error("Eroare la actualizarea facturii:", error);
      return undefined;
    }
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM invoices
        WHERE id = ${id}
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea facturii:", error);
      return false;
    }
  }
  
  // TimeLog operations
  async getTimeLog(id: number): Promise<TimeLog | undefined> {
    try {
      const result = await db`
        SELECT * FROM time_logs
        WHERE id = ${id}
        LIMIT 1
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as TimeLog;
    } catch (error) {
      console.error("Eroare la obținerea înregistrării de timp:", error);
      return undefined;
    }
  }
  
  async getTimeLogsByProject(projectId: number): Promise<TimeLog[]> {
    try {
      const result = await db`
        SELECT * FROM time_logs
        WHERE project_id = ${projectId}
        ORDER BY date DESC
      `;
      
      return result as unknown as TimeLog[];
    } catch (error) {
      console.error("Eroare la obținerea înregistrărilor de timp pentru proiect:", error);
      return [];
    }
  }
  
  async getTimeLogsByUser(userId: number): Promise<TimeLog[]> {
    try {
      const result = await db`
        SELECT * FROM time_logs
        WHERE user_id = ${userId}
        ORDER BY date DESC
      `;
      
      return result as unknown as TimeLog[];
    } catch (error) {
      console.error("Eroare la obținerea înregistrărilor de timp pentru utilizator:", error);
      return [];
    }
  }
  
  async getTimeLogsByTask(taskId: number): Promise<TimeLog[]> {
    try {
      const result = await db`
        SELECT * FROM time_logs
        WHERE task_id = ${taskId}
        ORDER BY date DESC
      `;
      
      return result as unknown as TimeLog[];
    } catch (error) {
      console.error("Eroare la obținerea înregistrărilor de timp pentru task:", error);
      return [];
    }
  }
  
  async createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog> {
    try {
      const now = new Date();
      const timeLogData = {
        ...timeLog,
        created_at: now,
        updated_at: now
      };
      
      const result = await db`
        INSERT INTO time_logs ${db(timeLogData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Înregistrarea de timp a fost creată dar nu a putut fi recuperată");
      }
      
      return result[0] as TimeLog;
    } catch (error: any) {
      console.error("Eroare la crearea înregistrării de timp:", error);
      throw new Error(`Nu s-a putut crea înregistrarea de timp: ${error.message || 'Eroare necunoscută'}`);
    }
  }
  
  async updateTimeLog(id: number, timeLogData: Partial<TimeLog>): Promise<TimeLog | undefined> {
    try {
      if (Object.keys(timeLogData).length === 0) {
        return await this.getTimeLog(id);
      }
      
      const updatedData = {
        ...timeLogData,
        updated_at: new Date()
      };
      
      const result = await db`
        UPDATE time_logs
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return undefined;
      }
      
      return result[0] as TimeLog;
    } catch (error) {
      console.error("Eroare la actualizarea înregistrării de timp:", error);
      return undefined;
    }
  }
  
  async deleteTimeLog(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM time_logs
        WHERE id = ${id}
        RETURNING id
      `;
      
      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea înregistrării de timp:", error);
      return false;
    }
  }
  
  // ActivityLog operations
  async getActivityLogsByOrganization(organizationId: number, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const result = await db`
        SELECT * FROM activity_logs
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      
      return result as unknown as ActivityLog[];
    } catch (error) {
      console.error("Eroare la obținerea jurnalului de activități al organizației:", error);
      return [];
    }
  }
  
  async getActivityLogsByUser(userId: number, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const result = await db`
        SELECT * FROM activity_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      
      return result as unknown as ActivityLog[];
    } catch (error) {
      console.error("Eroare la obținerea jurnalului de activități al utilizatorului:", error);
      return [];
    }
  }
  
  async getActivityLogsByEntity(entityType: string, entityId: number, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const result = await db`
        SELECT * FROM activity_logs
        WHERE entity_type = ${entityType} AND entity_id = ${entityId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      
      return result as unknown as ActivityLog[];
    } catch (error) {
      console.error("Eroare la obținerea jurnalului de activități pentru entitate:", error);
      return [];
    }
  }
  
  async createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog> {
    try {
      const now = new Date();
      const logData = {
        ...activityLog,
        created_at: now
      };
      
      const result = await db`
        INSERT INTO activity_logs ${db(logData)}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error("Jurnalul de activitate a fost creat dar nu a putut fi recuperat");
      }
      
      return result[0] as ActivityLog;
    } catch (error: any) {
      console.error("Eroare la crearea jurnalului de activitate:", error);
      // Nu aruncăm excepție pentru a nu întrerupe fluxul aplicației
      return {
        id: -1,
        organization_id: activityLog.organization_id,
        user_id: activityLog.user_id,
        entity_type: activityLog.entity_type,
        entity_id: activityLog.entity_id,
        action_type: activityLog.action_type,
        action_details: activityLog.action_details,
        created_at: new Date()
      };
    }
  }
}

// MemStorage implementare ca backup sau pentru testare
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private organizations: Map<number, Organization>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private invoices: Map<number, Invoice>;
  private timeLogs: Map<number, TimeLog>;
  private activityLogs: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private orgIdCounter: number;
  private clientIdCounter: number;
  private projectIdCounter: number;
  private taskIdCounter: number;
  private invoiceIdCounter: number;
  private timeLogIdCounter: number;
  private activityLogIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.invoices = new Map();
    this.timeLogs = new Map();
    this.activityLogs = new Map();
    
    this.userIdCounter = 1;
    this.orgIdCounter = 1;
    this.clientIdCounter = 1;
    this.projectIdCounter = 1;
    this.taskIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.timeLogIdCounter = 1;
    this.activityLogIdCounter = 1;
    
    // Utilizăm un MemoryStore pentru sesiuni (doar pentru dezvoltare/testare)
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Curățare o dată pe zi
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
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
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      ...userData,
      updated_at: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.organization_id === organizationId
    );
  }
  
  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }
  
  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(
      org => org.slug === slug
    );
  }
  
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const id = this.orgIdCounter++;
    const now = new Date();
    
    const newOrg: Organization = {
      id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo ?? null,
      organization_type: organization.organization_type,
      subscription_plan: organization.subscription_plan ?? 'trial',
      trial_expires_at: organization.trial_expires_at ?? null,
      subscription_started_at: organization.subscription_started_at ?? null,
      subscription_expires_at: organization.subscription_expires_at ?? null,
      is_active: organization.is_active ?? true,
      created_at: now,
      updated_at: now
    };
    
    this.organizations.set(id, newOrg);
    return newOrg;
  }
  
  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    
    const updatedOrg = {
      ...org,
      ...orgData,
      updated_at: new Date()
    };
    
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async getClientsByOrganization(organizationId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      client => client.organization_id === organizationId
    );
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const now = new Date();
    
    const newClient: Client = {
      id,
      ...client,
      created_at: now,
      updated_at: now
    };
    
    this.clients.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = {
      ...client,
      ...clientData,
      updated_at: new Date()
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectsByOrganization(organizationId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.organization_id === organizationId
    );
  }
  
  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.client_id === clientId
    );
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    
    const newProject: Project = {
      id,
      ...project,
      completion_percentage: project.completion_percentage ?? 0,
      created_at: now,
      updated_at: now
    };
    
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = {
      ...project,
      ...projectData,
      updated_at: new Date()
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.project_id === projectId
    );
  }
  
  async getTasksByUser(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.assigned_to === userId
    );
  }
  
  async getTasksByOrganization(organizationId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.organization_id === organizationId
    );
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    
    const newTask: Task = {
      id,
      ...task,
      completion_percentage: task.completion_percentage ?? 0,
      created_at: now,
      updated_at: now
    };
    
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = {
      ...task,
      ...taskData,
      updated_at: new Date()
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
  
  async getInvoicesByOrganization(organizationId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      invoice => invoice.organization_id === organizationId
    );
  }
  
  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      invoice => invoice.client_id === clientId
    );
  }
  
  async getInvoicesByProject(projectId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      invoice => invoice.project_id === projectId
    );
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const now = new Date();
    
    const newInvoice: Invoice = {
      id,
      ...invoice,
      paid_amount: invoice.paid_amount ?? 0,
      remaining_amount: invoice.remaining_amount ?? invoice.total_amount,
      created_at: now,
      updated_at: now
    };
    
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }
  
  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = {
      ...invoice,
      ...invoiceData,
      updated_at: new Date()
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }
  
  // TimeLog operations
  async getTimeLog(id: number): Promise<TimeLog | undefined> {
    return this.timeLogs.get(id);
  }
  
  async getTimeLogsByProject(projectId: number): Promise<TimeLog[]> {
    return Array.from(this.timeLogs.values()).filter(
      timeLog => timeLog.project_id === projectId
    );
  }
  
  async getTimeLogsByUser(userId: number): Promise<TimeLog[]> {
    return Array.from(this.timeLogs.values()).filter(
      timeLog => timeLog.user_id === userId
    );
  }
  
  async getTimeLogsByTask(taskId: number): Promise<TimeLog[]> {
    return Array.from(this.timeLogs.values()).filter(
      timeLog => timeLog.task_id === taskId
    );
  }
  
  async createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog> {
    const id = this.timeLogIdCounter++;
    const now = new Date();
    
    const newTimeLog: TimeLog = {
      id,
      ...timeLog,
      created_at: now,
      updated_at: now
    };
    
    this.timeLogs.set(id, newTimeLog);
    return newTimeLog;
  }
  
  async updateTimeLog(id: number, timeLogData: Partial<TimeLog>): Promise<TimeLog | undefined> {
    const timeLog = this.timeLogs.get(id);
    if (!timeLog) return undefined;
    
    const updatedTimeLog = {
      ...timeLog,
      ...timeLogData,
      updated_at: new Date()
    };
    
    this.timeLogs.set(id, updatedTimeLog);
    return updatedTimeLog;
  }
  
  async deleteTimeLog(id: number): Promise<boolean> {
    return this.timeLogs.delete(id);
  }
  
  // ActivityLog operations
  async getActivityLogsByOrganization(organizationId: number, limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.organization_id === organizationId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
  
  async getActivityLogsByUser(userId: number, limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
  
  async getActivityLogsByEntity(entityType: string, entityId: number, limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.entity_type === entityType && log.entity_id === entityId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }
  
  async createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const now = new Date();
    
    const newActivityLog: ActivityLog = {
      id,
      ...activityLog,
      created_at: now
    };
    
    this.activityLogs.set(id, newActivityLog);
    return newActivityLog;
  }
}

// Folosim DatabaseStorage pentru conectarea la PostgreSQL
export const storage = new DatabaseStorage();
