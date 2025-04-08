import { db } from "./db";
import bcrypt from "bcryptjs";
import {
  User,
  InsertUser,
  Organization,
  InsertOrganization,
  Client,
  InsertClient,
  Project,
  InsertProject,
  Task,
  InsertTask,
  Invoice,
  InsertInvoice,
  InvoiceItem,
  InsertInvoiceItem,
  InvoicePayment,
  InsertInvoicePayment,
  TimeLog,
  InsertTimeLog,
  ActivityLog,
  InsertActivityLog,
  Automation,
  InsertAutomation,
  AutomationTrigger,
  InsertAutomationTrigger,
  AutomationAction,
  InsertAutomationAction,
  AutomationLog,
  InsertAutomationLog,
  Department,
  InsertDepartment,
  TeamMember,
  InsertTeamMember,
  DepartmentMember,
  InsertDepartmentMember,
  Notification,
  InsertNotification,
  NotificationPreference,
  InsertNotificationPreference,
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
  getOrganizationById(id: number): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(
    id: number,
    organizationData: Partial<Organization>,
  ): Promise<Organization | undefined>;
  updateOrganizationStructure(
    id: number,
    structureData: { has_departments: boolean },
  ): Promise<Organization | undefined>;
  
  // Notification operations
  getNotificationById(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Notification preferences operations
  getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: number, preferences: Partial<NotificationPreference>): Promise<NotificationPreference | undefined>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientsByOrganization(organizationId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(
    id: number,
    clientData: Partial<Client>,
  ): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByOrganization(organizationId: number): Promise<Project[]>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  getProjectsForUser(userId: number, organizationId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(
    id: number,
    projectData: Partial<Project>,
  ): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  getTasksByOrganization(organizationId: number): Promise<Task[]>;
  getTasksForUser(userId: number, organizationId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByOrganization(organizationId: number): Promise<Invoice[]>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoicesByProject(projectId: number): Promise<Invoice[]>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByEntity(entityType: string, entityId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, commentData: Partial<Comment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  getInvoicePayments(invoiceId: number): Promise<InvoicePayment[]>;
  createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoice(
    id: number,
    invoiceData: Partial<Invoice>,
  ): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // TimeLog operations
  getTimeLog(id: number): Promise<TimeLog | undefined>;
  getTimeLogsByProject(projectId: number): Promise<TimeLog[]>;
  getTimeLogsByUser(userId: number): Promise<TimeLog[]>;
  getTimeLogsByTask(taskId: number): Promise<TimeLog[]>;
  createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog>;
  updateTimeLog(
    id: number,
    timeLogData: Partial<TimeLog>,
  ): Promise<TimeLog | undefined>;
  deleteTimeLog(id: number): Promise<boolean>;

  // ActivityLog operations
  getActivityLogsByOrganization(
    organizationId: number,
    limit?: number,
  ): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByEntity(
    entityType: string,
    entityId: number,
    limit?: number,
  ): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;

  // Automation operations
  getAutomation(id: number): Promise<Automation | undefined>;
  getAutomationsByOrganization(organizationId: number): Promise<Automation[]>;
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  updateAutomation(
    id: number,
    automationData: Partial<Automation>,
  ): Promise<Automation | undefined>;
  deleteAutomation(id: number): Promise<boolean>;

  // AutomationTrigger operations
  getAutomationTrigger(id: number): Promise<AutomationTrigger | undefined>;
  getAutomationTriggersByAutomationId(
    automationId: number,
  ): Promise<AutomationTrigger[]>;
  createAutomationTrigger(
    trigger: InsertAutomationTrigger,
  ): Promise<AutomationTrigger>;
  updateAutomationTrigger(
    id: number,
    triggerData: Partial<AutomationTrigger>,
  ): Promise<AutomationTrigger | undefined>;
  deleteAutomationTrigger(id: number): Promise<boolean>;

  // AutomationAction operations
  getAutomationAction(id: number): Promise<AutomationAction | undefined>;
  getAutomationActionsByAutomationId(
    automationId: number,
  ): Promise<AutomationAction[]>;
  createAutomationAction(
    action: InsertAutomationAction,
  ): Promise<AutomationAction>;
  updateAutomationAction(
    id: number,
    actionData: Partial<AutomationAction>,
  ): Promise<AutomationAction | undefined>;
  deleteAutomationAction(id: number): Promise<boolean>;

  // AutomationLog operations
  getAutomationLog(id: number): Promise<AutomationLog | undefined>;
  getAutomationLogsByAutomationId(
    automationId: number,
    limit?: number,
  ): Promise<AutomationLog[]>;
  getAutomationLogsByOrganization(
    organizationId: number,
    limit?: number,
  ): Promise<AutomationLog[]>;
  createAutomationLog(log: InsertAutomationLog): Promise<AutomationLog>;

  // Department operations
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentsByOrganization(organizationId: number): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(
    id: number,
    departmentData: Partial<Department>,
  ): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // TeamMember operations
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  getTeamMembersByOrganization(organizationId: number): Promise<TeamMember[]>;
  getTeamMemberByEmail(email: string): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(
    id: number,
    teamMemberData: Partial<TeamMember>,
  ): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;

  // DepartmentMember operations
  getDepartmentMember(id: number): Promise<DepartmentMember | undefined>;
  getDepartmentMembersByDepartment(departmentId: number): Promise<DepartmentMember[]>;
  getDepartmentMembersByTeamMember(teamMemberId: number): Promise<DepartmentMember[]>;
  createDepartmentMember(departmentMember: InsertDepartmentMember): Promise<DepartmentMember>;
  updateDepartmentMember(
    id: number,
    departmentMemberData: Partial<DepartmentMember>,
  ): Promise<DepartmentMember | undefined>;
  deleteDepartmentMember(id: number): Promise<boolean>;

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
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      },
      createTableIfMissing: true,
    });
  }
  
  // Department operations
  async getDepartment(id: number): Promise<Department | undefined> {
    try {
      const result = await db`
        SELECT * FROM departments
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as Department;
    } catch (error) {
      console.error("Eroare la obținerea departamentului:", error);
      return undefined;
    }
  }

  async getDepartmentsByOrganization(organizationId: number): Promise<Department[]> {
    try {
      const result = await db`
        SELECT * FROM departments
        WHERE organization_id = ${organizationId}
        ORDER BY name
      `;

      return result as unknown as Department[];
    } catch (error) {
      console.error("Eroare la obținerea departamentelor organizației:", error);
      return [];
    }
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    try {
      const now = new Date();
      const departmentData = {
        ...department,
        created_at: now,
        updated_at: now,
      };

      const result = await db`
        INSERT INTO departments ${db(departmentData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Departamentul a fost creat dar nu a putut fi recuperat");
      }

      return result[0] as Department;
    } catch (error: any) {
      console.error("Eroare la crearea departamentului:", error);
      throw new Error(
        `Nu s-a putut crea departamentul: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateDepartment(
    id: number,
    departmentData: Partial<Department>,
  ): Promise<Department | undefined> {
    try {
      if (Object.keys(departmentData).length === 0) {
        return await this.getDepartment(id);
      }

      const updatedData = {
        ...departmentData,
        updated_at: new Date(),
      };

      const result = await db`
        UPDATE departments
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as Department;
    } catch (error) {
      console.error("Eroare la actualizarea departamentului:", error);
      return undefined;
    }
  }

  async deleteDepartment(id: number): Promise<boolean> {
    try {
      // Mai întâi ștergem toate relațiile dintre departament și membri
      await db`
        DELETE FROM department_members
        WHERE department_id = ${id}
      `;

      // Apoi ștergem departamentul
      const result = await db`
        DELETE FROM departments
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea departamentului:", error);
      return false;
    }
  }

  // TeamMember operations
  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    try {
      const result = await db`
        SELECT * FROM team_members
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as TeamMember;
    } catch (error) {
      console.error("Eroare la obținerea membrului echipei:", error);
      return undefined;
    }
  }

  async getTeamMembersByOrganization(organizationId: number): Promise<TeamMember[]> {
    try {
      const result = await db`
        SELECT * FROM team_members
        WHERE organization_id = ${organizationId}
        ORDER BY first_name, last_name
      `;

      return result as unknown as TeamMember[];
    } catch (error) {
      console.error("Eroare la obținerea membrilor echipei organizației:", error);
      return [];
    }
  }

  async getTeamMemberByEmail(email: string): Promise<TeamMember | undefined> {
    try {
      const result = await db`
        SELECT * FROM team_members
        WHERE email = ${email}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as TeamMember;
    } catch (error) {
      console.error("Eroare la obținerea membrului echipei după email:", error);
      return undefined;
    }
  }

  async checkAndCreateTeamMembersTable(): Promise<boolean> {
    try {
      // Verifică dacă tabelul există
      const teamMembersExists = await this.tableExists('team_members');
      if (!teamMembersExists) {
        // Creează tabelul dacă nu există
        await db`
          CREATE TABLE IF NOT EXISTS team_members (
            id SERIAL PRIMARY KEY,
            organization_id INTEGER NOT NULL,
            user_id INTEGER,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            role VARCHAR(50) NOT NULL,
            position VARCHAR(100),
            bio TEXT,
            avatar VARCHAR(255),
            hourly_rate NUMERIC(10,2),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            temp_password VARCHAR(100),
            password_set BOOLEAN NOT NULL DEFAULT FALSE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `;
        console.log("Tabelul team_members a fost creat cu succes");
        return true;
      }
      
      // Verifică dacă sunt necesare migrări pentru a adăuga coloanele noi
      const columnsResult = await db`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'team_members' 
          AND column_name IN ('temp_password', 'password_set')
      `;
      
      // Dacă nu avem aceste coloane, le adăugăm
      if (columnsResult.length < 2) {
        const missingColumns = ['temp_password', 'password_set'].filter(
          col => !columnsResult.some(r => r.column_name === col)
        );
        
        for (const column of missingColumns) {
          if (column === 'temp_password') {
            await db`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS temp_password VARCHAR(100)`;
          } else if (column === 'password_set') {
            await db`ALTER TABLE team_members ADD COLUMN IF NOT EXISTS password_set BOOLEAN NOT NULL DEFAULT FALSE`;
          }
        }
        
        console.log("Tabelul team_members a fost actualizat cu coloanele necesare");
      }
      
      return true;
    } catch (error) {
      console.error("Eroare la verificarea/crearea tabelului team_members:", error);
      return false;
    }
  }

  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    try {
      // Verifică sau creează tabelul team_members înainte de a adăuga un nou membru
      const tableReady = await this.checkAndCreateTeamMembersTable();
      if (!tableReady) {
        throw new Error("Nu s-a putut crea sau verifica tabelul team_members");
      }
      
      const now = new Date();
      
      // Generăm o parolă temporară pentru membru
      const tempPassword = this.generateRandomPassword(10);
      
      // 1. Creăm un utilizator corespunzător în tabela users
      let userId = null;
      try {
        // Verificăm dacă utilizatorul există deja
        const existingUser = await this.getUserByUsername(teamMember.email);
        
        if (!existingUser) {
          // Mapăm rolul de membru echipă la un rol de utilizator valid
          let userRole = "employee"; // Valoare implicită
          
          // Mapare între rolurile de membru echipă și rolurile de utilizatori
          const roleMapping = {
            "administrator": "super_admin",
            "manager": "manager",
            "angajat": "employee",
            "colaborator": "employee",
            "asociat": "employee"
          } as const;
          
          // Obținem rolul corespunzător sau folosim valoarea implicită
          if (teamMember.role && teamMember.role in roleMapping) {
            userRole = roleMapping[teamMember.role as keyof typeof roleMapping];
          }
          
          // Creăm un utilizator nou dacă nu există
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          const newUser = await this.createUser({
            email: teamMember.email,
            password: hashedPassword, // Folosim parola temporară criptată cu bcrypt
            firstName: teamMember.first_name,
            lastName: teamMember.last_name,
            role: userRole, // Folosim rolul mapat
            organizationId: teamMember.organization_id
          });
          
          userId = newUser.id;
          console.log(`Utilizator nou creat pentru membrul echipei cu ID-ul: ${userId}`);
        } else {
          // Dacă utilizatorul există deja, folosim id-ul existent
          userId = existingUser.id;
          console.log(`Utilizator existent pentru membrul echipei cu ID-ul: ${userId}`);
        }
      } catch (userError) {
        console.error("Eroare la crearea utilizatorului pentru membrul echipei:", userError);
        // Continuăm fără a crea utilizator, dar logam eroarea
      }
      
      // Asigurăm că toate câmpurile necesare au valori
      // Extragem doar câmpurile necesare pentru a evita valori nedefinite
      const teamMemberData = {
        organization_id: teamMember.organization_id,
        first_name: teamMember.first_name,
        last_name: teamMember.last_name,
        email: teamMember.email,
        role: teamMember.role,
        created_by: teamMember.created_by,
        // Câmpuri opționale cu valori implicite
        phone: teamMember.phone || null,
        position: teamMember.position || null,
        bio: teamMember.bio || null,
        avatar: teamMember.avatar || null,
        hourly_rate: teamMember.hourly_rate || null,
        user_id: userId, // Asociem ID-ul utilizatorului creat sau existent
        is_active: teamMember.is_active ?? true,
        temp_password: tempPassword,
        password_set: false,
        created_at: now,
        updated_at: now,
      };

      console.log("Date membru echipă pentru inserare:", JSON.stringify(teamMemberData));

      const result = await db`
        INSERT INTO team_members ${db(teamMemberData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Membrul echipei a fost creat dar nu a putut fi recuperat");
      }

      return result[0] as TeamMember;
    } catch (error: any) {
      console.error("Eroare la crearea membrului echipei:", error);
      throw new Error(
        `Nu s-a putut crea membrul echipei: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }
  
  generateRandomPassword(length: number): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  async updateTeamMember(
    id: number,
    teamMemberData: Partial<TeamMember>,
  ): Promise<TeamMember | undefined> {
    try {
      if (Object.keys(teamMemberData).length === 0) {
        return await this.getTeamMember(id);
      }

      const updatedData = {
        ...teamMemberData,
        updated_at: new Date(),
      };

      const result = await db`
        UPDATE team_members
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as TeamMember;
    } catch (error) {
      console.error("Eroare la actualizarea membrului echipei:", error);
      return undefined;
    }
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    try {
      // Mai întâi ștergem toate relațiile dintre membru și departamente
      await db`
        DELETE FROM department_members
        WHERE team_member_id = ${id}
      `;

      // Apoi ștergem membrul echipei
      const result = await db`
        DELETE FROM team_members
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea membrului echipei:", error);
      return false;
    }
  }

  // DepartmentMember operations
  async getDepartmentMember(id: number): Promise<DepartmentMember | undefined> {
    try {
      const result = await db`
        SELECT * FROM department_members
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as DepartmentMember;
    } catch (error) {
      console.error("Eroare la obținerea relației departament-membru:", error);
      return undefined;
    }
  }

  async getDepartmentMembersByDepartment(departmentId: number): Promise<DepartmentMember[]> {
    try {
      const result = await db`
        SELECT * FROM department_members
        WHERE department_id = ${departmentId}
      `;

      return result as unknown as DepartmentMember[];
    } catch (error) {
      console.error("Eroare la obținerea membrilor departamentului:", error);
      return [];
    }
  }

  async getDepartmentMembersByTeamMember(teamMemberId: number): Promise<DepartmentMember[]> {
    try {
      const result = await db`
        SELECT * FROM department_members
        WHERE team_member_id = ${teamMemberId}
      `;

      return result as unknown as DepartmentMember[];
    } catch (error) {
      console.error("Eroare la obținerea departamentelor membrului:", error);
      return [];
    }
  }

  async createDepartmentMember(departmentMember: InsertDepartmentMember): Promise<DepartmentMember> {
    try {
      const now = new Date();
      const departmentMemberData = {
        ...departmentMember,
        is_manager: departmentMember.is_manager ?? false,
        created_at: now,
        updated_at: now,
      };

      const result = await db`
        INSERT INTO department_members ${db(departmentMemberData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Relația departament-membru a fost creată dar nu a putut fi recuperată");
      }

      return result[0] as DepartmentMember;
    } catch (error: any) {
      console.error("Eroare la crearea relației departament-membru:", error);
      throw new Error(
        `Nu s-a putut crea relația departament-membru: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateDepartmentMember(
    id: number,
    departmentMemberData: Partial<DepartmentMember>,
  ): Promise<DepartmentMember | undefined> {
    try {
      if (Object.keys(departmentMemberData).length === 0) {
        return await this.getDepartmentMember(id);
      }

      const updatedData = {
        ...departmentMemberData,
        updated_at: new Date(),
      };

      const result = await db`
        UPDATE department_members
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as DepartmentMember;
    } catch (error) {
      console.error("Eroare la actualizarea relației departament-membru:", error);
      return undefined;
    }
  }

  async deleteDepartmentMember(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM department_members
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea relației departament-membru:", error);
      return false;
    }
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
      console.log(`[DEBUG] Căutare utilizator cu email: ${username}`);
      console.log(`[DEBUG] String de conexiune: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'nedefinit'}`);
      
      // Folosim clientul PostgreSQL direct - username este de fapt email în implementarea noastră
      const result = await db`
        SELECT * FROM users
        WHERE email = ${username}
        LIMIT 1
      `;

      console.log(`[DEBUG] Rezultat căutare utilizator: ${result.length > 0 ? 'Găsit' : 'Negăsit'}`);
      
      if (result.length === 0) {
        return undefined;
      }

      return result[0] as User;
    } catch (error) {
      console.error("[DEBUG] Eroare la obținerea utilizatorului după email:", error);
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
        role: insertUser.role ?? "ceo",
        organization_id: insertUser.organizationId ?? null,
      };

      // Inserăm utilizatorul folosind clientul PostgreSQL direct
      const result = await db`
        INSERT INTO users ${db(userData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error(
          "Utilizatorul a fost creat dar nu a putut fi recuperat",
        );
      }

      return result[0] as User;
    } catch (error: any) {
      console.error("Eroare la crearea utilizatorului:", error);
      throw new Error(
        `Nu s-a putut crea utilizatorul: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<User | undefined> {
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
  
  async getOrganizationById(id: number): Promise<Organization | undefined> {
    return this.getOrganization(id);
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

  async createOrganization(
    organization: InsertOrganization,
  ): Promise<Organization> {
    try {
      const now = new Date();
      const orgData = {
        ...organization,
        subscription_plan: organization.subscription_plan ?? "trial",
        is_active: organization.is_active ?? true,
        created_at: now,
        updated_at: now,
      };

      const result = await db`
        INSERT INTO organizations ${db(orgData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error(
          "Organizația a fost creată dar nu a putut fi recuperată",
        );
      }

      return result[0] as Organization;
    } catch (error: any) {
      console.error("Eroare la crearea organizației:", error);
      throw new Error(
        `Nu s-a putut crea organizația: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateOrganization(
    id: number,
    organizationData: Partial<Organization>,
  ): Promise<Organization | undefined> {
    try {
      if (Object.keys(organizationData).length === 0) {
        return await this.getOrganization(id);
      }

      const updatedData = {
        ...organizationData,
        updated_at: new Date(),
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
  
  async updateOrganizationStructure(
    id: number,
    structureData: { has_departments: boolean },
  ): Promise<Organization | undefined> {
    try {
      const result = await db`
        UPDATE organizations
        SET 
          has_departments = ${structureData.has_departments},
          updated_at = ${new Date()}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as Organization;
    } catch (error) {
      console.error("Eroare la actualizarea structurii organizației:", error);
      return undefined;
    }
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    try {
      console.log(
        "DatabaseStorage.getClient - id primit:",
        id,
        "tip:",
        typeof id,
      );

      const result = await db`
        SELECT * FROM clients
        WHERE id = ${id}
        LIMIT 1
      `;

      console.log(
        "DatabaseStorage.getClient - rezultat SQL:",
        result.length > 0 ? "găsit" : "negăsit",
        result.length > 0
          ? `client id=${result[0].id}, nume=${result[0].company_name}`
          : "",
      );

      console.log("Rezultat client: ", result);

      if (result.length === 0) {
        return undefined;
      }

      // Returnăm primul element din array (care este un obiect Client)
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
        updated_at: now,
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
      throw new Error(
        `Nu s-a putut crea clientul: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateClient(
    id: number,
    clientData: Partial<Client>,
  ): Promise<Client | undefined> {
    try {
      if (Object.keys(clientData).length === 0) {
        return await this.getClient(id);
      }

      const updatedData = {
        ...clientData,
        updated_at: new Date(),
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
      console.log(
        "DatabaseStorage.getProject - id primit:",
        id,
        "tip:",
        typeof id,
      );

      const result = await db`
        SELECT * FROM projects
        WHERE id = ${id}
        LIMIT 1
      `;

      console.log(
        "DatabaseStorage.getProject - rezultat SQL:",
        result.length > 0 ? "găsit" : "negăsit",
        result.length > 0
          ? `project id=${result[0].id}, nume=${result[0].name}`
          : "",
      );

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
  
  async getProjectsForUser(userId: number, organizationId: number): Promise<Project[]> {
    try {
      // Obținem rolul utilizatorului
      const user = await this.getUser(userId);
      if (!user) {
        console.error(`Nu s-a găsit utilizatorul cu ID-ul ${userId}`);
        return [];
      }
      
      // CEO și super_admin văd toate proiectele
      if (user.role === 'ceo' || user.role === 'super_admin') {
        return this.getProjectsByOrganization(organizationId);
      }
      
      // Pentru manager, angajați și colaboratori, obținem proiectele la care sunt asignați
      // Managerul vede toate proiectele unde este manager_id
      if (user.role === 'manager') {
        const result = await db`
          SELECT * FROM projects
          WHERE organization_id = ${organizationId}
            AND (manager_id = ${userId} OR 
                id IN (
                  SELECT project_id FROM tasks 
                  WHERE assignee_id = ${userId} AND organization_id = ${organizationId}
                ))
          ORDER BY start_date DESC, name
        `;
        return result as unknown as Project[];
      }
      
      // Angajații și colaboratorii văd doar proiectele cu task-uri asignate lor
      const result = await db`
        SELECT DISTINCT p.* FROM projects p
        JOIN tasks t ON p.id = t.project_id
        WHERE p.organization_id = ${organizationId}
          AND t.assignee_id = ${userId}
        ORDER BY p.start_date DESC, p.name
      `;
      
      return result as unknown as Project[];
    } catch (error) {
      console.error("Eroare la obținerea proiectelor pentru utilizator:", error);
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
        updated_at: now,
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
      throw new Error(
        `Nu s-a putut crea proiectul: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateProject(
    id: number,
    projectData: Partial<Project>,
  ): Promise<Project | undefined> {
    try {
      if (Object.keys(projectData).length === 0) {
        return await this.getProject(id);
      }

      const updatedData = {
        ...projectData,
        updated_at: new Date(),
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
      console.log(
        "DatabaseStorage.getTask - id primit:",
        id,
        "tip:",
        typeof id,
      );

      const result = await db`
        SELECT * FROM tasks
        WHERE id = ${id}
        LIMIT 1
      `;

      console.log(
        "DatabaseStorage.getTask - rezultat SQL:",
        result.length > 0 ? "găsit" : "negăsit",
        result.length > 0
          ? `task id=${result[0].id}, titlu=${result[0].title}`
          : "",
      );

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
        WHERE assignee_id = ${userId}
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
  
  async getTasksForUser(userId: number, organizationId: number): Promise<Task[]> {
    try {
      // Obținem rolul utilizatorului
      const user = await this.getUser(userId);
      if (!user) {
        console.error(`Nu s-a găsit utilizatorul cu ID-ul ${userId}`);
        return [];
      }
      
      // CEO și super_admin văd toate task-urile
      if (user.role === 'ceo' || user.role === 'super_admin') {
        return this.getTasksByOrganization(organizationId);
      }
      
      // Pentru manager, obținem task-urile unde este manager de proiect sau asignat direct
      if (user.role === 'manager') {
        const result = await db`
          SELECT t.* FROM tasks t
          LEFT JOIN projects p ON t.project_id = p.id
          WHERE t.organization_id = ${organizationId}
            AND (t.assignee_id = ${userId} OR p.manager_id = ${userId})
          ORDER BY t.due_date ASC NULLS LAST, t.priority DESC, t.title
        `;
        return result as unknown as Task[];
      }
      
      // Angajații și colaboratorii văd doar task-urile asignate lor
      const result = await db`
        SELECT * FROM tasks
        WHERE organization_id = ${organizationId}
          AND assignee_id = ${userId}
        ORDER BY due_date ASC NULLS LAST, priority DESC, title
      `;
      
      return result as unknown as Task[];
    } catch (error) {
      console.error("Eroare la obținerea task-urilor pentru utilizator:", error);
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
        updated_at: now,
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
      throw new Error(
        `Nu s-a putut crea task-ul: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateTask(
    id: number,
    taskData: Partial<Task>,
  ): Promise<Task | undefined> {
    try {
      if (Object.keys(taskData).length === 0) {
        return await this.getTask(id);
      }

      const updatedData = {
        ...taskData,
        updated_at: new Date(),
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

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    try {
      const result = await db`
        SELECT * FROM invoice_items
        WHERE invoice_id = ${invoiceId}
        ORDER BY order_index, id
      `;

      return result as unknown as InvoiceItem[];
    } catch (error) {
      console.error("Eroare la obținerea elementelor facturii:", error);
      return [];
    }
  }
  
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      // Folosim doar datele din parametru, fără a adăuga coloanele created_at și updated_at
      // care nu există în tabelul invoice_items din baza de date
      const itemData = { ...item };

      const result = await db`
        INSERT INTO invoice_items ${db(itemData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Elementul facturii a fost creat dar nu a putut fi recuperat");
      }

      return result[0] as InvoiceItem;
    } catch (error: any) {
      console.error("Eroare la crearea elementului facturii:", error);
      throw new Error(
        `Nu s-a putut crea elementul facturii: ${error.message || "Eroare necunoscută"}`
      );
    }
  }

  async getInvoicePayments(invoiceId: number): Promise<InvoicePayment[]> {
    try {
      // Verificăm dacă tabelul invoice_payments există
      const tableExists = await this.tableExists('invoice_payments');
      if (!tableExists) {
        // Dacă tabelul nu există, îl vom crea
        await this.createInvoicePaymentsTable();
        return []; // Returnăm un array gol dacă tabelul tocmai a fost creat
      }
      
      // Acum putem obține plățile asociate facturii
      const paymentsResult = await db`
        SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name
        FROM invoice_payments p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.invoice_id = ${invoiceId}
        ORDER BY p.payment_date DESC
      `;
      
      return paymentsResult as unknown as InvoicePayment[];
    } catch (error) {
      console.error("Eroare la obținerea plăților facturii:", error);
      return [];
    }
  }
  
  async createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment> {
    try {
      // Verificăm dacă tabelul invoice_payments există
      const tableExists = await this.tableExists('invoice_payments');
      if (!tableExists) {
        // Dacă tabelul nu există, îl vom crea
        await this.createInvoicePaymentsTable();
      }
      
      // Adăugăm datele și ora la obiectul de plată
      const now = new Date();
      const paymentData = {
        ...payment,
        payment_date: payment.payment_date || now,
        created_at: now,
        updated_at: now
      };

      // Inseram plata în baza de date
      const result = await db`
        INSERT INTO invoice_payments ${db(paymentData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Plata a fost creată dar nu a putut fi recuperată");
      }
      
      // Actualizăm factura pentru a reflecta plata
      const invoice = await this.getInvoice(payment.invoice_id);
      if (invoice) {
        const newPaidAmount = (invoice.paid_amount || 0) + payment.amount;
        const newRemainingAmount = invoice.total_amount - newPaidAmount;
        const newStatus = newRemainingAmount <= 0 ? 'paid' : invoice.status;
        
        // Actualizăm factura cu noile valori
        await this.updateInvoice(invoice.id, {
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus
        });
      }

      return result[0] as InvoicePayment;
    } catch (error: any) {
      console.error("Eroare la crearea plății:", error);
      throw new Error(`Nu s-a putut crea plata: ${error.message || "Eroare necunoscută"}`);
    }
  }
  
  async createInvoicePaymentsTable(): Promise<void> {
    try {
      console.log("Crearea tabelului invoice_payments...");
      await db`
        CREATE TABLE IF NOT EXISTS invoice_payments (
          id SERIAL PRIMARY KEY,
          invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          amount NUMERIC(15, 2) NOT NULL,
          payment_date TIMESTAMP NOT NULL,
          payment_method VARCHAR(100) NOT NULL,
          reference TEXT,
          notes TEXT,
          created_by INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `;
      console.log("Tabelul invoice_payments a fost creat cu succes");
    } catch (error) {
      console.error("Eroare la crearea tabelului invoice_payments:", error);
      throw error;
    }
  }
  
  // Notification operations
  async checkAndCreateNotificationTables(): Promise<boolean> {
    try {
      // Verifică dacă tabelul notifications există
      const notificationsExists = await this.tableExists('notifications');
      if (!notificationsExists) {
        // Creează tabelul dacă nu există
        await db`
          CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            organization_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            sender_id INTEGER,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            priority VARCHAR(20) NOT NULL DEFAULT 'normal',
            read_status VARCHAR(20) NOT NULL DEFAULT 'unread',
            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER,
            action_url TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMP
          )
        `;
        console.log("Tabelul notifications a fost creat cu succes");
      }
      
      // Verifică dacă tabelul notification_preferences există
      const preferencesExists = await this.tableExists('notification_preferences');
      if (!preferencesExists) {
        // Creează tabelul dacă nu există
        await db`
          CREATE TABLE IF NOT EXISTS notification_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE,
            email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
            push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
            browser_notifications BOOLEAN NOT NULL DEFAULT TRUE,
            task_assigned BOOLEAN NOT NULL DEFAULT TRUE,
            task_completed BOOLEAN NOT NULL DEFAULT TRUE,
            task_deadline BOOLEAN NOT NULL DEFAULT TRUE,
            comment_added BOOLEAN NOT NULL DEFAULT TRUE,
            project_update BOOLEAN NOT NULL DEFAULT TRUE,
            invoice_status BOOLEAN NOT NULL DEFAULT TRUE,
            payment_received BOOLEAN NOT NULL DEFAULT TRUE,
            team_member_added BOOLEAN NOT NULL DEFAULT TRUE,
            system_alert BOOLEAN NOT NULL DEFAULT TRUE,
            quiet_hours_start VARCHAR(5),
            quiet_hours_end VARCHAR(5),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `;
        console.log("Tabelul notification_preferences a fost creat cu succes");
      }
      
      return true;
    } catch (error) {
      console.error("Eroare la verificarea/crearea tabelelor pentru notificări:", error);
      return false;
    }
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    try {
      // Asigurăm-ne că tabelele există
      await this.checkAndCreateNotificationTables();
      
      const result = await db`
        SELECT * FROM notifications
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as Notification;
    } catch (error) {
      console.error("Eroare la obținerea notificării:", error);
      return undefined;
    }
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      // Asigurăm-ne că tabelele există
      await this.checkAndCreateNotificationTables();
      
      const result = await db`
        SELECT n.*, 
               CONCAT(u.first_name, ' ', u.last_name) as sender_name,
               CASE 
                 WHEN n.created_at > NOW() - INTERVAL '24 hours' THEN true 
                 ELSE false 
               END as is_new
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.recipient_id = ${userId}
        ORDER BY n.created_at DESC
      `;

      return result as Notification[];
    } catch (error) {
      console.error("Eroare la obținerea notificărilor utilizatorului:", error);
      return [];
    }
  }
  
  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      // Asigurăm-ne că tabelele există
      await this.checkAndCreateNotificationTables();
      
      const result = await db`
        SELECT n.*, 
               CONCAT(u.first_name, ' ', u.last_name) as sender_name,
               CASE 
                 WHEN n.created_at > NOW() - INTERVAL '24 hours' THEN true 
                 ELSE false 
               END as is_new
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.recipient_id = ${userId}
          AND n.read_status = 'unread'
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
        ORDER BY n.created_at DESC
      `;

      return result as Notification[];
    } catch (error) {
      console.error("Eroare la obținerea notificărilor necitite ale utilizatorului:", error);
      return [];
    }
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    try {
      // Asigurăm-ne că tabelele există
      await this.checkAndCreateNotificationTables();
      
      const result = await db`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE recipient_id = ${userId}
          AND read_status = 'unread'
          AND (expires_at IS NULL OR expires_at > NOW())
      `;

      return parseInt(result[0]?.count) || 0;
    } catch (error) {
      console.error("Eroare la numărarea notificărilor necitite:", error);
      return 0;
    }
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      // Asigurăm-ne că tabelele există
      await this.checkAndCreateNotificationTables();
      
      const now = new Date();
      const notificationData = {
        ...notification,
        created_at: now
      };

      const result = await db`
        INSERT INTO notifications ${db(notificationData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Notificarea a fost creată dar nu a putut fi recuperată");
      }

      return result[0] as Notification;
    } catch (error: any) {
      console.error("Eroare la crearea notificării:", error);
      throw new Error(
        `Nu s-a putut crea notificarea: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      const now = new Date();
      const result = await db`
        UPDATE notifications
        SET read_status = 'read', read_at = ${now}
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la marcarea notificării ca citită:", error);
      return false;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      const now = new Date();
      const result = await db`
        UPDATE notifications
        SET read_status = 'read', read_at = ${now}
        WHERE recipient_id = ${userId}
          AND read_status = 'unread'
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la marcarea tuturor notificărilor ca citite:", error);
      return false;
    }
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM notifications
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea notificării:", error);
      return false;
    }
  }
  
  // Notification preferences operations
  async getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
    try {
      // Asigurăm-ne că tabelele există
      await this.checkAndCreateNotificationTables();
      
      const result = await db`
        SELECT * FROM notification_preferences
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as NotificationPreference;
    } catch (error) {
      console.error("Eroare la obținerea preferințelor de notificare:", error);
      return undefined;
    }
  }
  
  async createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference> {
    try {
      // Asigurăm-ne că tabelele există
      await this.checkAndCreateNotificationTables();
      
      const now = new Date();
      const preferencesData = {
        ...preferences,
        created_at: now,
        updated_at: now
      };

      const result = await db`
        INSERT INTO notification_preferences ${db(preferencesData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Preferințele de notificare au fost create dar nu au putut fi recuperate");
      }

      return result[0] as NotificationPreference;
    } catch (error: any) {
      console.error("Eroare la crearea preferințelor de notificare:", error);
      throw new Error(
        `Nu s-au putut crea preferințele de notificare: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }
  
  async updateNotificationPreferences(userId: number, preferences: Partial<NotificationPreference>): Promise<NotificationPreference | undefined> {
    try {
      if (Object.keys(preferences).length === 0) {
        return await this.getNotificationPreferences(userId);
      }

      const updatedData = {
        ...preferences,
        updated_at: new Date()
      };

      const result = await db`
        UPDATE notification_preferences
        SET ${db(updatedData)}
        WHERE user_id = ${userId}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as NotificationPreference;
    } catch (error) {
      console.error("Eroare la actualizarea preferințelor de notificare:", error);
      return undefined;
    }
  }
  
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await db`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        )
      `;
      return result[0].exists;
    } catch (error) {
      console.error(`Eroare la verificarea existenței tabelului ${tableName}:`, error);
      return false;
    }
  }
  
  // Creează tabelul de comentarii dacă nu există
  async checkAndCreateCommentsTable(): Promise<boolean> {
    try {
      // Verificăm dacă tabela există
      const commentsExists = await this.tableExists('comments');
      if (!commentsExists) {
        // Creăm tabela dacă nu există
        await db`
          CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            parent_id INTEGER,
            attachment_ids INTEGER[],
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_user
              FOREIGN KEY(user_id) 
              REFERENCES users(id)
              ON DELETE CASCADE
          )
        `;
        
        // Creăm indecșii pentru eficiență
        await db`CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id)`;
        await db`CREATE INDEX idx_comments_user ON comments(user_id)`;
        
        console.log("Tabelul comments a fost creat cu succes");
      } else {
        // Verificăm dacă coloana parent_id există
        const parentIdExists = await db`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'comments' AND column_name = 'parent_id'
          ) as exists
        `;
        
        // Adăugăm coloana parent_id dacă nu există
        if (!parentIdExists[0].exists) {
          console.log("Adăugăm coloana parent_id la tabela comments");
          await db`ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE`;
        }
        
        // Verificăm dacă coloana attachment_ids există
        const attachmentIdsExists = await db`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'comments' AND column_name = 'attachment_ids'
          ) as exists
        `;
        
        // Adăugăm coloana attachment_ids dacă nu există
        if (!attachmentIdsExists[0].exists) {
          console.log("Adăugăm coloana attachment_ids la tabela comments");
          await db`ALTER TABLE comments ADD COLUMN attachment_ids INTEGER[]`;
        }
      }
      return true;
    } catch (error) {
      console.error("Eroare la verificarea/crearea tabelului comments:", error);
      return false;
    }
  }
  
  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    try {
      // Asigurăm că tabelul există
      await this.checkAndCreateCommentsTable();
      
      const result = await db`
        SELECT 
          c.*,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.avatar as user_avatar
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as unknown as Comment;
    } catch (error) {
      console.error("Eroare la obținerea comentariului:", error);
      return undefined;
    }
  }

  async getCommentsByEntity(entityType: string, entityId: number): Promise<Comment[]> {
    try {
      // Asigurăm că tabelul există
      await this.checkAndCreateCommentsTable();
      
      const result = await db`
        SELECT 
          c.*,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.avatar as user_avatar
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.entity_type = ${entityType} AND c.entity_id = ${entityId}
        ORDER BY c.created_at DESC
      `;

      return result as unknown as Comment[];
    } catch (error) {
      console.error(`Eroare la obținerea comentariilor pentru ${entityType} cu ID ${entityId}:`, error);
      return [];
    }
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    try {
      // Asigurăm că tabelul există
      await this.checkAndCreateCommentsTable();
      
      const now = new Date();
      const commentData = {
        entity_type: comment.entity_type,
        entity_id: comment.entity_id,
        user_id: comment.user_id,
        content: comment.content,
        parent_id: comment.parent_id || null,
        attachment_ids: comment.attachment_ids || null,
        is_internal: comment.is_internal || false,
        created_at: now,
        updated_at: now
      };

      const result = await db`
        INSERT INTO comments ${db(commentData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Comentariul a fost creat dar nu a putut fi recuperat");
      }
      
      // Obținem numele utilizatorului
      const userData = await db`
        SELECT CONCAT(first_name, ' ', last_name) as user_name, avatar
        FROM users
        WHERE id = ${comment.user_id}
        LIMIT 1
      `;
      
      const commentWithUserData = {
        ...result[0],
        user_name: userData.length > 0 ? userData[0].user_name : 'Utilizator necunoscut',
        user_avatar: userData.length > 0 ? userData[0].avatar : null
      };

      return commentWithUserData as unknown as Comment;
    } catch (error: any) {
      console.error("Eroare la crearea comentariului:", error);
      throw new Error(
        `Nu s-a putut crea comentariul: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateComment(id: number, commentData: Partial<Comment>): Promise<Comment | undefined> {
    try {
      if (Object.keys(commentData).length === 0) {
        return await this.getComment(id);
      }

      const updatedData = {
        ...commentData,
        updated_at: new Date(),
      };
      
      // Eliminăm câmpurile care nu sunt în schema bazei de date
      delete (updatedData as any).user_name;
      delete (updatedData as any).user_avatar;

      const result = await db`
        UPDATE comments
        SET ${db(updatedData)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }
      
      // Obținem numele utilizatorului
      const userData = await db`
        SELECT CONCAT(first_name, ' ', last_name) as user_name, avatar
        FROM users
        WHERE id = ${result[0].user_id}
        LIMIT 1
      `;
      
      const commentWithUserData = {
        ...result[0],
        user_name: userData.length > 0 ? userData[0].user_name : 'Utilizator necunoscut',
        user_avatar: userData.length > 0 ? userData[0].avatar : null
      };

      return commentWithUserData as unknown as Comment;
    } catch (error) {
      console.error("Eroare la actualizarea comentariului:", error);
      return undefined;
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM comments
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea comentariului:", error);
      return false;
    }
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const now = new Date();
      
      // Verificăm toate câmpurile și ne asigurăm că au valori definite
      // Adaptăm datele pentru a se potrivi cu structura tabelului din baza de date
      const invoiceData: any = {
        client_id: invoice.client_id,
        organization_id: invoice.organization_id,
        created_by: invoice.created_by,
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        status: invoice.status || 'sent',
        total_amount: invoice.total_amount || 0, // Folosim total_amount direct (coloana a fost redenumită)
        tax_amount: invoice.tax_amount || 0,
        currency: invoice.currency || 'RON',
        created_at: now,
        updated_at: now,
        subtotal: invoice.subtotal || 0,
        discount_amount: invoice.discount_amount || 0,
        discount_rate: invoice.discount_rate || 0,
        tax_rate: invoice.tax_rate || 19, // TVA standard în România
        paid_amount: invoice.paid_amount || 0,
        remaining_amount: invoice.remaining_amount || invoice.total_amount || 0,
      };
      
      // Adăugăm doar câmpurile care nu sunt undefined
      if (invoice.project_id) invoiceData.project_id = invoice.project_id;
      if (invoice.notes) invoiceData.notes = invoice.notes;
      if (invoice.payment_terms) invoiceData.payment_terms = invoice.payment_terms; // Nume coloană actualizat

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
      throw new Error(
        `Nu s-a putut crea factura: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateInvoice(
    id: number,
    invoiceData: Partial<Invoice>,
  ): Promise<Invoice | undefined> {
    try {
      if (Object.keys(invoiceData).length === 0) {
        return await this.getInvoice(id);
      }
      
      // Adaptăm datele pentru structura bazei de date
      const adaptedData: any = {
        updated_at: new Date(),
      };
      
      // Mapăm doar câmpurile care există în baza de date, folosind noile denumiri de coloane
      if (invoiceData.client_id) adaptedData.client_id = invoiceData.client_id;
      if (invoiceData.project_id) adaptedData.project_id = invoiceData.project_id;
      if (invoiceData.invoice_number) adaptedData.invoice_number = invoiceData.invoice_number;
      if (invoiceData.issue_date) adaptedData.issue_date = invoiceData.issue_date;
      if (invoiceData.due_date) adaptedData.due_date = invoiceData.due_date;
      if (invoiceData.status) adaptedData.status = invoiceData.status;
      if (invoiceData.total_amount) adaptedData.total_amount = invoiceData.total_amount; // Nume coloană actualizat
      if (invoiceData.tax_amount) adaptedData.tax_amount = invoiceData.tax_amount;
      if (invoiceData.tax_rate) adaptedData.tax_rate = invoiceData.tax_rate; // Coloană nouă
      if (invoiceData.subtotal) adaptedData.subtotal = invoiceData.subtotal; // Coloană nouă
      if (invoiceData.discount_amount) adaptedData.discount_amount = invoiceData.discount_amount; // Coloană nouă
      if (invoiceData.discount_rate) adaptedData.discount_rate = invoiceData.discount_rate; // Coloană nouă
      if (invoiceData.paid_amount) adaptedData.paid_amount = invoiceData.paid_amount;
      if (invoiceData.remaining_amount) adaptedData.remaining_amount = invoiceData.remaining_amount;
      if (invoiceData.currency) adaptedData.currency = invoiceData.currency;
      if (invoiceData.notes) adaptedData.notes = invoiceData.notes;
      if (invoiceData.payment_terms) adaptedData.payment_terms = invoiceData.payment_terms; // Nume coloană actualizat
      
      const updatedData = adaptedData;

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
        ORDER BY date DESC, start_time DESC
      `;

      return result as unknown as TimeLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea înregistrărilor de timp pentru proiect:",
        error,
      );
      return [];
    }
  }

  async getTimeLogsByUser(userId: number): Promise<TimeLog[]> {
    try {
      const result = await db`
        SELECT * FROM time_logs
        WHERE user_id = ${userId}
        ORDER BY date DESC, start_time DESC
      `;

      return result as unknown as TimeLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea înregistrărilor de timp pentru utilizator:",
        error,
      );
      return [];
    }
  }

  async getTimeLogsByTask(taskId: number): Promise<TimeLog[]> {
    try {
      const result = await db`
        SELECT * FROM time_logs
        WHERE task_id = ${taskId}
        ORDER BY date DESC, start_time DESC
      `;

      return result as unknown as TimeLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea înregistrărilor de timp pentru task:",
        error,
      );
      return [];
    }
  }
  
  async getTimeLogsByOrganization(organizationId: number): Promise<TimeLog[]> {
    try {
      const result = await db`
        SELECT * FROM time_logs
        WHERE organization_id = ${organizationId}
        ORDER BY date DESC, start_time DESC
      `;

      return result as unknown as TimeLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea înregistrărilor de timp pentru organizație:",
        error,
      );
      return [];
    }
  }

  async createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog> {
    try {
      const now = new Date();
      const timeLogData = {
        ...timeLog,
        created_at: now,
        updated_at: now,
      };

      const result = await db`
        INSERT INTO time_logs ${db(timeLogData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error(
          "Înregistrarea de timp a fost creată dar nu a putut fi recuperată",
        );
      }

      return result[0] as TimeLog;
    } catch (error: any) {
      console.error("Eroare la crearea înregistrării de timp:", error);
      throw new Error(
        `Nu s-a putut crea înregistrarea de timp: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateTimeLog(
    id: number,
    timeLogData: Partial<TimeLog>,
  ): Promise<TimeLog | undefined> {
    try {
      if (Object.keys(timeLogData).length === 0) {
        return await this.getTimeLog(id);
      }

      const updatedData = {
        ...timeLogData,
        updated_at: new Date(),
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
  async getActivityLogsByOrganization(
    organizationId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    try {
      const result = await db`
        SELECT * FROM activity_logs
        WHERE organization_id = ${organizationId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return result as unknown as ActivityLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea jurnalului de activități al organizației:",
        error,
      );
      return [];
    }
  }

  async getActivityLogsByUser(
    userId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    try {
      const result = await db`
        SELECT * FROM activity_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return result as unknown as ActivityLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea jurnalului de activități al utilizatorului:",
        error,
      );
      return [];
    }
  }

  async getActivityLogsByEntity(
    entityType: string,
    entityId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    try {
      const result = await db`
        SELECT * FROM activity_logs
        WHERE entity_type = ${entityType} AND entity_id = ${entityId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return result as unknown as ActivityLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea jurnalului de activități pentru entitate:",
        error,
      );
      return [];
    }
  }

  async createActivityLog(
    activityLog: InsertActivityLog,
  ): Promise<ActivityLog> {
    try {
      const now = new Date();
      const logData = {
        ...activityLog,
        created_at: now,
      };

      const result = await db`
        INSERT INTO activity_logs ${db(logData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error(
          "Jurnalul de activitate a fost creat dar nu a putut fi recuperat",
        );
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
        created_at: new Date(),
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
    const MemoryStore = require("memorystore")(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Curățare o dată pe zi
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
      role: insertUser.role ?? "ceo",
      organization_id: insertUser.organizationId ?? null,
      created_at: now,
      updated_at: now,
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: number,
    userData: Partial<User>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...userData,
      updated_at: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByOrganization(organizationId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.organization_id === organizationId,
    );
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(
      (org) => org.slug === slug,
    );
  }

  async createOrganization(
    organization: InsertOrganization,
  ): Promise<Organization> {
    const id = this.orgIdCounter++;
    const now = new Date();

    const newOrg: Organization = {
      id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo ?? null,
      organization_type: organization.organization_type,
      subscription_plan: organization.subscription_plan ?? "trial",
      trial_expires_at: organization.trial_expires_at ?? null,
      subscription_started_at: organization.subscription_started_at ?? null,
      subscription_expires_at: organization.subscription_expires_at ?? null,
      is_active: organization.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    this.organizations.set(id, newOrg);
    return newOrg;
  }

  async updateOrganization(
    id: number,
    orgData: Partial<Organization>,
  ): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;

    const updatedOrg = {
      ...org,
      ...orgData,
      updated_at: new Date(),
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
      (client) => client.organization_id === organizationId,
    );
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const now = new Date();

    const newClient: Client = {
      id,
      ...client,
      created_at: now,
      updated_at: now,
    };

    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(
    id: number,
    clientData: Partial<Client>,
  ): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updatedClient = {
      ...client,
      ...clientData,
      updated_at: new Date(),
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
      (project) => project.organization_id === organizationId,
    );
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.client_id === clientId,
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
      updated_at: now,
    };

    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(
    id: number,
    projectData: Partial<Project>,
  ): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = {
      ...project,
      ...projectData,
      updated_at: new Date(),
    };

    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Aceste metode nu sunt folosite, deoarece folosim DatabaseStorage în implementarea curentă
  // Ele sunt înlocuite cu implementările din DatabaseStorage
  /*
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
  */

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();

    const newTask: Task = {
      id,
      ...task,
      completion_percentage: task.completion_percentage ?? 0,
      created_at: now,
      updated_at: now,
    };

    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(
    id: number,
    taskData: Partial<Task>,
  ): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = {
      ...task,
      ...taskData,
      updated_at: new Date(),
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
      (invoice) => invoice.organization_id === organizationId,
    );
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.client_id === clientId,
    );
  }

  async getInvoicesByProject(projectId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.project_id === projectId,
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
      updated_at: now,
    };

    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(
    id: number,
    invoiceData: Partial<Invoice>,
  ): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const updatedInvoice = {
      ...invoice,
      ...invoiceData,
      updated_at: new Date(),
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
      (timeLog) => timeLog.project_id === projectId,
    );
  }

  async getTimeLogsByUser(userId: number): Promise<TimeLog[]> {
    return Array.from(this.timeLogs.values()).filter(
      (timeLog) => timeLog.user_id === userId,
    );
  }

  async getTimeLogsByTask(taskId: number): Promise<TimeLog[]> {
    return Array.from(this.timeLogs.values()).filter(
      (timeLog) => timeLog.task_id === taskId,
    );
  }

  async createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog> {
    const id = this.timeLogIdCounter++;
    const now = new Date();

    const newTimeLog: TimeLog = {
      id,
      ...timeLog,
      created_at: now,
      updated_at: now,
    };

    this.timeLogs.set(id, newTimeLog);
    return newTimeLog;
  }

  async updateTimeLog(
    id: number,
    timeLogData: Partial<TimeLog>,
  ): Promise<TimeLog | undefined> {
    const timeLog = this.timeLogs.get(id);
    if (!timeLog) return undefined;

    const updatedTimeLog = {
      ...timeLog,
      ...timeLogData,
      updated_at: new Date(),
    };

    this.timeLogs.set(id, updatedTimeLog);
    return updatedTimeLog;
  }

  async deleteTimeLog(id: number): Promise<boolean> {
    return this.timeLogs.delete(id);
  }

  // ActivityLog operations
  async getActivityLogsByOrganization(
    organizationId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.organization_id === organizationId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  async getActivityLogsByUser(
    userId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  async getActivityLogsByEntity(
    entityType: string,
    entityId: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(
        (log) => log.entity_type === entityType && log.entity_id === entityId,
      )
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  async createActivityLog(
    activityLog: InsertActivityLog,
  ): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const now = new Date();

    const newActivityLog: ActivityLog = {
      id,
      ...activityLog,
      created_at: now,
    };

    this.activityLogs.set(id, newActivityLog);
    return newActivityLog;
  }

  // Automation operations
  async getAutomation(id: number): Promise<Automation | undefined> {
    try {
      console.log(`Obțin automatizarea cu ID ${id}`);
      // Obținem automatizarea de bază
      const result = await db`
        SELECT * FROM automations
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        console.log(`Nu s-a găsit nicio automatizare cu ID ${id}`);
        return undefined;
      }

      // Obținem trigger-urile asociate
      const triggers = await db`
        SELECT * FROM automation_triggers
        WHERE automation_id = ${id}
        ORDER BY order_index
      `;

      // Obținem acțiunile asociate
      const actions = await db`
        SELECT * FROM automation_actions
        WHERE automation_id = ${id}
        ORDER BY order_index
      `;

      // Obținem ultimul log de execuție
      const logs = await db`
        SELECT * FROM automation_logs
        WHERE automation_id = ${id}
        ORDER BY executed_at DESC
        LIMIT 1
      `;

      const automationBase = result[0];
      
      // Formăm obiectul complet al automatizării
      const automation: Automation = {
        ...automationBase,
        trigger_types: triggers.map(t => t.trigger_type),
        action_types: actions.map(a => a.action_type),
        execution_count: await this.getAutomationExecutionCount(id),
        last_execution_status: logs.length > 0 ? logs[0].execution_status : null,
        last_execution_time: logs.length > 0 ? logs[0].executed_at : null
      };

      console.log(`Automatizare obținută cu succes: ${automation.name}`);
      return automation;
    } catch (error) {
      console.error("Eroare la obținerea automatizării:", error);
      return undefined;
    }
  }

  async getAutomationExecutionCount(automationId: number): Promise<number> {
    try {
      const result = await db`
        SELECT COUNT(*) as count FROM automation_logs
        WHERE automation_id = ${automationId}
      `;
      return parseInt(result[0].count, 10) || 0;
    } catch (error) {
      console.error("Eroare la numărarea execuțiilor automatizării:", error);
      return 0;
    }
  }

  async getAutomationsByOrganization(
    organizationId: number,
  ): Promise<Automation[]> {
    try {
      console.log(`Obțin automatizările pentru organizația ${organizationId}`);
      // Obținem toate automatizările pentru organizație
      const automations = await db`
        SELECT * FROM automations
        WHERE organization_id = ${organizationId}
        ORDER BY name
      `;

      if (automations.length === 0) {
        console.log(`Nu s-au găsit automatizări pentru organizația ${organizationId}`);
        return [];
      }

      // Pentru fiecare automatizare, obținem tipurile de trigger și acțiune
      const result: Automation[] = [];
      
      for (const automationBase of automations) {
        // Obținem trigger-urile asociate
        const triggers = await db`
          SELECT * FROM automation_triggers
          WHERE automation_id = ${automationBase.id}
          ORDER BY order_index
        `;

        // Obținem acțiunile asociate
        const actions = await db`
          SELECT * FROM automation_actions
          WHERE automation_id = ${automationBase.id}
          ORDER BY order_index
        `;

        // Obținem ultimul log de execuție
        const logs = await db`
          SELECT * FROM automation_logs
          WHERE automation_id = ${automationBase.id}
          ORDER BY executed_at DESC
          LIMIT 1
        `;

        // Formăm obiectul complet al automatizării
        const automation: Automation = {
          ...automationBase,
          trigger_types: triggers.map(t => t.trigger_type),
          action_types: actions.map(a => a.action_type),
          execution_count: await this.getAutomationExecutionCount(automationBase.id),
          last_execution_status: logs.length > 0 ? logs[0].execution_status : null,
          last_execution_time: logs.length > 0 ? logs[0].executed_at : null
        };

        result.push(automation);
      }

      console.log(`S-au găsit ${result.length} automatizări pentru organizația ${organizationId}`);
      return result;
    } catch (error) {
      console.error("Eroare la obținerea automatizărilor organizației:", error);
      return [];
    }
  }

  async createAutomation(automation: InsertAutomation): Promise<Automation> {
    try {
      const now = new Date();
      
      // Pasul 1: Creăm înregistrarea de bază pentru automatizare
      const automationBaseData = {
        organization_id: automation.organization_id,
        name: automation.name,
        description: automation.description || null,
        is_active: automation.is_active ?? true,
        created_by: automation.created_by,
        updated_by: automation.created_by,
        created_at: now,
        updated_at: now,
      };

      console.log("Se inserează automatizarea:", automationBaseData);
      
      const result = await db`
        INSERT INTO automations ${db(automationBaseData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error(
          "Automatizarea a fost creată dar nu a putut fi recuperată",
        );
      }

      const createdAutomationBase = result[0];
      const automationId = createdAutomationBase.id;
      
      console.log(`Automatizare creată cu succes, ID: ${automationId}`);
      
      // Pasul 2: Creăm trigger-uri pentru această automatizare
      for (let i = 0; i < automation.trigger_types.length; i++) {
        const triggerType = automation.trigger_types[i];
        const entityType = 'task'; // Implicit pentru moment, poate fi parametrizat ulterior
        
        await this.createAutomationTrigger({
          automation_id: automationId,
          trigger_type: triggerType,
          entity_type: entityType,
          conditions: {},
          order_index: i
        });
        
        console.log(`Trigger creat pentru automatizarea ${automationId}: ${triggerType}`);
      }
      
      // Pasul 3: Creăm acțiuni pentru această automatizare
      for (let i = 0; i < automation.action_types.length; i++) {
        const actionType = automation.action_types[i];
        
        await this.createAutomationAction({
          automation_id: automationId,
          action_type: actionType,
          action_config: {},
          order_index: i
        });
        
        console.log(`Acțiune creată pentru automatizarea ${automationId}: ${actionType}`);
      }
      
      // Pasul 4: Returnăm automatizarea completă
      const completeAutomation = await this.getAutomation(automationId);
      if (!completeAutomation) {
        throw new Error("Nu s-a putut obține automatizarea creată");
      }
      
      return completeAutomation;
    } catch (error: any) {
      console.error("Eroare la crearea automatizării:", error);
      throw new Error(
        `Nu s-a putut crea automatizarea: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateAutomation(
    id: number,
    automationData: Partial<Automation>,
  ): Promise<Automation | undefined> {
    try {
      console.log(`Actualizare automatizare cu ID ${id}`, automationData);
      
      if (Object.keys(automationData).length === 0) {
        return await this.getAutomation(id);
      }

      // Obținem datele de bază pentru actualizare (fără trigger_types și action_types)
      const { trigger_types, action_types, ...baseData } = automationData;
      
      // Adăugăm un timestamp pentru actualizare
      const dataToUpdate = {
        ...baseData,
        updated_at: new Date(),
        updated_by: automationData.updated_by || null
      };

      console.log("Date de bază pentru actualizare:", dataToUpdate);
      
      // Actualizăm entitatea de bază
      const result = await db`
        UPDATE automations
        SET ${db(dataToUpdate)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        console.log(`Nu s-a găsit automatizarea cu ID ${id} pentru actualizare`);
        return undefined;
      }
      
      console.log(`Automatizare actualizată cu succes: ${result[0].name}`);
      
      // Dacă sunt trimise și trigger_types, actualizăm trigger-ele
      if (trigger_types && Array.isArray(trigger_types) && trigger_types.length > 0) {
        console.log(`Actualizare trigger-uri pentru automatizarea ${id}`);
        
        // Ștergem trigger-ele existente
        await db`DELETE FROM automation_triggers WHERE automation_id = ${id}`;
        
        // Adăugăm noile trigger-uri
        for (let i = 0; i < trigger_types.length; i++) {
          const triggerType = trigger_types[i];
          const entityType = 'task'; // Implicit pentru moment
          
          await this.createAutomationTrigger({
            automation_id: id,
            trigger_type: triggerType,
            entity_type: entityType,
            conditions: {},
            order_index: i
          });
          
          console.log(`Trigger recreat pentru automatizarea ${id}: ${triggerType}`);
        }
      }
      
      // Dacă sunt trimise și action_types, actualizăm acțiunile
      if (action_types && Array.isArray(action_types) && action_types.length > 0) {
        console.log(`Actualizare acțiuni pentru automatizarea ${id}`);
        
        // Ștergem acțiunile existente
        await db`DELETE FROM automation_actions WHERE automation_id = ${id}`;
        
        // Adăugăm noile acțiuni
        for (let i = 0; i < action_types.length; i++) {
          const actionType = action_types[i];
          
          await this.createAutomationAction({
            automation_id: id,
            action_type: actionType,
            action_config: {},
            order_index: i
          });
          
          console.log(`Acțiune recreată pentru automatizarea ${id}: ${actionType}`);
        }
      }
      
      // Returnăm automatizarea completă actualizată
      const updatedAutomation = await this.getAutomation(id);
      console.log(`Automatizare obținută după actualizare:`, updatedAutomation);
      
      return updatedAutomation;
    } catch (error) {
      console.error("Eroare la actualizarea automatizării:", error);
      return undefined;
    }
  }

  async deleteAutomation(id: number): Promise<boolean> {
    try {
      // Ștergem mai întâi acțiunile și trigger-ele asociate
      await db`DELETE FROM automation_actions WHERE automation_id = ${id}`;
      await db`DELETE FROM automation_triggers WHERE automation_id = ${id}`;

      // Apoi ștergem automatizarea
      const result = await db`
        DELETE FROM automations
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea automatizării:", error);
      return false;
    }
  }

  // AutomationTrigger operations
  async getAutomationTrigger(
    id: number,
  ): Promise<AutomationTrigger | undefined> {
    try {
      const result = await db`
        SELECT * FROM automation_triggers
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      // Procesăm rezultatul pentru a converti câmpurile JSON
      const trigger = result[0] as any;

      // Convertim câmpul conditions din JSON
      if (trigger.conditions && typeof trigger.conditions === "string") {
        try {
          trigger.conditions = JSON.parse(trigger.conditions);
        } catch (e) {
          console.error("Eroare la parsarea JSON pentru conditions:", e);
          trigger.conditions = {};
        }
      }

      return trigger as AutomationTrigger;
    } catch (error) {
      console.error("Eroare la obținerea trigger-ului automatizării:", error);
      return undefined;
    }
  }

  async getAutomationTriggersByAutomationId(
    automationId: number,
  ): Promise<AutomationTrigger[]> {
    try {
      const result = await db`
        SELECT * FROM automation_triggers
        WHERE automation_id = ${automationId}
        ORDER BY order_index
      `;

      // Procesăm rezultatele pentru a converti câmpurile JSON
      return result.map((trigger) => {
        if (trigger.conditions && typeof trigger.conditions === "string") {
          try {
            trigger.conditions = JSON.parse(trigger.conditions);
          } catch (e) {
            console.error("Eroare la parsarea JSON pentru conditions:", e);
            trigger.conditions = {};
          }
        }
        return trigger as AutomationTrigger;
      });
    } catch (error) {
      console.error("Eroare la obținerea trigger-elor automatizării:", error);
      return [];
    }
  }

  async createAutomationTrigger(
    trigger: InsertAutomationTrigger,
  ): Promise<AutomationTrigger> {
    try {
      const now = new Date();
      const triggerData = {
        automation_id: trigger.automation_id,
        trigger_type: trigger.trigger_type,
        entity_type: trigger.entity_type,
        conditions: JSON.stringify(trigger.conditions),
        order_index: trigger.order_index,
        created_at: now,
        updated_at: now,
      };

      const result = await db`
        INSERT INTO automation_triggers ${db(triggerData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Trigger-ul a fost creat dar nu a putut fi recuperat");
      }

      // Procesăm rezultatul pentru a converti câmpurile JSON
      const createdTrigger = result[0] as any;

      // Convertim câmpul conditions din JSON
      if (
        createdTrigger.conditions &&
        typeof createdTrigger.conditions === "string"
      ) {
        try {
          createdTrigger.conditions = JSON.parse(createdTrigger.conditions);
        } catch (e) {
          console.error("Eroare la parsarea JSON pentru conditions:", e);
          createdTrigger.conditions = {};
        }
      }

      return createdTrigger as AutomationTrigger;
    } catch (error: any) {
      console.error("Eroare la crearea trigger-ului automatizării:", error);
      throw new Error(
        `Nu s-a putut crea trigger-ul automatizării: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateAutomationTrigger(
    id: number,
    triggerData: Partial<AutomationTrigger>,
  ): Promise<AutomationTrigger | undefined> {
    try {
      if (Object.keys(triggerData).length === 0) {
        return await this.getAutomationTrigger(id);
      }

      // Procesăm datele pentru a converti câmpurile JSON
      const dataToUpdate: any = {
        ...triggerData,
        updated_at: new Date(),
      };

      // Convertim câmpul conditions în JSON pentru stocare
      if (dataToUpdate.conditions) {
        dataToUpdate.conditions = JSON.stringify(dataToUpdate.conditions);
      }

      const result = await db`
        UPDATE automation_triggers
        SET ${db(dataToUpdate)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }

      // Procesăm rezultatul pentru a converti câmpurile JSON
      const updatedTrigger = result[0] as any;

      // Convertim câmpul conditions din JSON
      if (
        updatedTrigger.conditions &&
        typeof updatedTrigger.conditions === "string"
      ) {
        try {
          updatedTrigger.conditions = JSON.parse(updatedTrigger.conditions);
        } catch (e) {
          console.error("Eroare la parsarea JSON pentru conditions:", e);
          updatedTrigger.conditions = {};
        }
      }

      return updatedTrigger as AutomationTrigger;
    } catch (error) {
      console.error(
        "Eroare la actualizarea trigger-ului automatizării:",
        error,
      );
      return undefined;
    }
  }

  async deleteAutomationTrigger(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM automation_triggers
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea trigger-ului automatizării:", error);
      return false;
    }
  }

  // AutomationAction operations
  async getAutomationAction(id: number): Promise<AutomationAction | undefined> {
    try {
      const result = await db`
        SELECT * FROM automation_actions
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      // Procesăm rezultatul pentru a converti câmpurile JSON
      const action = result[0] as any;

      // Convertim câmpul action_config din JSON
      if (action.action_config && typeof action.action_config === "string") {
        try {
          action.action_config = JSON.parse(action.action_config);
        } catch (e) {
          console.error("Eroare la parsarea JSON pentru action_config:", e);
          action.action_config = {};
        }
      }

      return action as AutomationAction;
    } catch (error) {
      console.error("Eroare la obținerea acțiunii automatizării:", error);
      return undefined;
    }
  }

  async getAutomationActionsByAutomationId(
    automationId: number,
  ): Promise<AutomationAction[]> {
    try {
      const result = await db`
        SELECT * FROM automation_actions
        WHERE automation_id = ${automationId}
        ORDER BY order_index
      `;

      // Procesăm rezultatele pentru a converti câmpurile JSON
      return result.map((action) => {
        if (action.action_config && typeof action.action_config === "string") {
          try {
            action.action_config = JSON.parse(action.action_config);
          } catch (e) {
            console.error("Eroare la parsarea JSON pentru action_config:", e);
            action.action_config = {};
          }
        }
        return action as AutomationAction;
      });
    } catch (error) {
      console.error("Eroare la obținerea acțiunilor automatizării:", error);
      return [];
    }
  }

  async createAutomationAction(
    action: InsertAutomationAction,
  ): Promise<AutomationAction> {
    try {
      const now = new Date();
      const actionData = {
        automation_id: action.automation_id,
        action_type: action.action_type,
        action_config: JSON.stringify(action.action_config),
        order_index: action.order_index,
        created_at: now,
        updated_at: now,
      };

      const result = await db`
        INSERT INTO automation_actions ${db(actionData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error("Acțiunea a fost creată dar nu a putut fi recuperată");
      }

      // Procesăm rezultatul pentru a converti câmpurile JSON
      const createdAction = result[0] as any;

      // Convertim câmpul action_config din JSON
      if (
        createdAction.action_config &&
        typeof createdAction.action_config === "string"
      ) {
        try {
          createdAction.action_config = JSON.parse(createdAction.action_config);
        } catch (e) {
          console.error("Eroare la parsarea JSON pentru action_config:", e);
          createdAction.action_config = {};
        }
      }

      return createdAction as AutomationAction;
    } catch (error: any) {
      console.error("Eroare la crearea acțiunii automatizării:", error);
      throw new Error(
        `Nu s-a putut crea acțiunea automatizării: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }

  async updateAutomationAction(
    id: number,
    actionData: Partial<AutomationAction>,
  ): Promise<AutomationAction | undefined> {
    try {
      if (Object.keys(actionData).length === 0) {
        return await this.getAutomationAction(id);
      }

      // Procesăm datele pentru a converti câmpurile JSON
      const dataToUpdate: any = {
        ...actionData,
        updated_at: new Date(),
      };

      // Convertim câmpul action_config în JSON pentru stocare
      if (dataToUpdate.action_config) {
        dataToUpdate.action_config = JSON.stringify(dataToUpdate.action_config);
      }

      const result = await db`
        UPDATE automation_actions
        SET ${db(dataToUpdate)}
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        return undefined;
      }

      // Procesăm rezultatul pentru a converti câmpurile JSON
      const updatedAction = result[0] as any;

      // Convertim câmpul action_config din JSON
      if (
        updatedAction.action_config &&
        typeof updatedAction.action_config === "string"
      ) {
        try {
          updatedAction.action_config = JSON.parse(updatedAction.action_config);
        } catch (e) {
          console.error("Eroare la parsarea JSON pentru action_config:", e);
          updatedAction.action_config = {};
        }
      }

      return updatedAction as AutomationAction;
    } catch (error) {
      console.error("Eroare la actualizarea acțiunii automatizării:", error);
      return undefined;
    }
  }

  async deleteAutomationAction(id: number): Promise<boolean> {
    try {
      const result = await db`
        DELETE FROM automation_actions
        WHERE id = ${id}
        RETURNING id
      `;

      return result.length > 0;
    } catch (error) {
      console.error("Eroare la ștergerea acțiunii automatizării:", error);
      return false;
    }
  }

  // AutomationLog operations
  async getAutomationLog(id: number): Promise<AutomationLog | undefined> {
    try {
      const result = await db`
        SELECT * FROM automation_logs
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.length === 0) {
        return undefined;
      }

      return result[0] as AutomationLog;
    } catch (error) {
      console.error("Eroare la obținerea logului automatizării:", error);
      return undefined;
    }
  }

  async getAutomationLogsByAutomationId(
    automationId: number,
    limit?: number,
  ): Promise<AutomationLog[]> {
    try {
      let query = db`
        SELECT * FROM automation_logs
        WHERE automation_id = ${automationId}
        ORDER BY executed_at DESC
      `;

      if (limit) {
        query = db`
          SELECT * FROM automation_logs
          WHERE automation_id = ${automationId}
          ORDER BY executed_at DESC
          LIMIT ${limit}
        `;
      }

      const result = await query;

      return result as unknown as AutomationLog[];
    } catch (error) {
      console.error("Eroare la obținerea logurilor automatizării:", error);
      return [];
    }
  }

  async getAutomationLogsByOrganization(
    organizationId: number,
    limit?: number,
  ): Promise<AutomationLog[]> {
    try {
      // Join cu tabela de automatizări pentru a obține logurile asociate organizației
      let query = db`
        SELECT al.* 
        FROM automation_logs al
        JOIN automations a ON al.automation_id = a.id
        WHERE a.organization_id = ${organizationId}
        ORDER BY al.executed_at DESC
      `;

      if (limit) {
        query = db`
          SELECT al.* 
          FROM automation_logs al
          JOIN automations a ON al.automation_id = a.id
          WHERE a.organization_id = ${organizationId}
          ORDER BY al.executed_at DESC
          LIMIT ${limit}
        `;
      }

      const result = await query;

      return result as unknown as AutomationLog[];
    } catch (error) {
      console.error(
        "Eroare la obținerea logurilor automatizărilor organizației:",
        error,
      );
      return [];
    }
  }

  async createAutomationLog(log: InsertAutomationLog): Promise<AutomationLog> {
    try {
      const now = new Date();
      const logData = {
        automation_id: log.automation_id,
        trigger_id: log.trigger_id || null,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        execution_status: log.execution_status,
        error_message: log.error_message || null,
        executed_at: now,
        created_at: now,
      };

      const result = await db`
        INSERT INTO automation_logs ${db(logData)}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error(
          "Logul automatizării a fost creat dar nu a putut fi recuperat",
        );
      }

      return result[0] as AutomationLog;
    } catch (error: any) {
      console.error("Eroare la crearea logului automatizării:", error);
      throw new Error(
        `Nu s-a putut crea logul automatizării: ${error.message || "Eroare necunoscută"}`,
      );
    }
  }
}

// Folosim DatabaseStorage pentru conectarea la PostgreSQL
export const storage = new DatabaseStorage();
