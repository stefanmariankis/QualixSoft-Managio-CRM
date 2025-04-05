import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import "express-session";
import { storage } from "./storage";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { registrationSchema } from "../shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurăm autentificarea
  setupAuth(app);
  // Rută de test
  app.get("/api/test", (req, res) => {
    return res.json({ success: true, message: "API funcționează corect" });
  });
  
  // Rută pentru verificarea schemei bazei de date
  app.get("/api/schema-info", async (req, res) => {
    try {
      // Obține informații despre tabele direct cu SQL
      const organizationsSchema = await db`
        SELECT 
          table_name, 
          column_name,
          data_type,
          udt_name
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
          AND table_name = 'organizations'
        ORDER BY ordinal_position
      `;
      
      const usersSchema = await db`
        SELECT 
          table_name, 
          column_name,
          data_type,
          udt_name
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
          AND table_name = 'users'
        ORDER BY ordinal_position
      `;
      
      // Obține exemple de date
      const organizationsData = await db`
        SELECT * FROM organizations LIMIT 1
      `;
      
      const usersData = await db`
        SELECT * FROM users LIMIT 1
      `;
      
      console.log("Informații schemă obținute cu succes");
      res.json({ 
        success: true, 
        organizationsSchema,
        usersSchema,
        organizationsExample: organizationsData,
        usersExample: usersData
      });
    } catch (error: any) {
      console.error("Eroare la obținerea informațiilor despre schemă:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Eroare la obținerea informațiilor despre schemă' 
      });
    }
  });
  
  // Ruta pentru înregistrare utilizator
  app.post("/api/register", async (req, res) => {
    try {
      console.log("Începere proces înregistrare");
      
      // Validează datele de înregistrare
      const validationResult = registrationSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.log("Date invalide pentru înregistrare:", validationResult.error.format());
        return res.status(400).json({
          message: "Date invalide",
          errors: validationResult.error.format(),
        });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        organizationType,
        companyName,
      } = validationResult.data;

      // Verifică dacă utilizatorul există deja
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Adresa de email este deja înregistrată" });
      }

      // Generează un slug unic pentru organizație
      const slug =
        companyName
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-") +
        "-" +
        Date.now().toString().slice(-4);

      // Creează organizația mai întâi
      const organization = {
        name: companyName,
        slug: slug,
        organization_type: organizationType,
        subscription_plan: "trial",
        is_active: true,
        trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 zile
      };

      // Verificăm schema direct cu clientul PostgreSQL
      console.log('Verificare schemă tabele înainte de inserare...');
      const schemaColumns = await db`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'organizations'
        ORDER BY ordinal_position
      `;
      
      console.log('Structura tabelei organizations:', schemaColumns);
      console.log("Se încearcă crearea organizației cu datele:", organization);
      
      // Folosim clientul PostgreSQL direct pentru inserare
      const newOrgResult = await db`
        INSERT INTO organizations ${db(organization)}
        RETURNING *
      `;

      if (!newOrgResult || newOrgResult.length === 0) {
        throw new Error("Nu s-a putut crea organizația: Nu s-a returnat niciun rezultat");
      }
      
      const newOrg = newOrgResult[0];
      console.log("Organizație creată cu succes:", newOrg);

      // Hash parola
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creează utilizatorul
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "ceo",
        organizationId: newOrg.id,
      });
      
      console.log("Utilizator creat cu succes, ID:", user.id);

      // Setăm sesiunea pentru a autentifica automat utilizatorul după înregistrare
      if (req.session) {
        req.session.userId = user.id;
        await new Promise<void>((resolve) => {
          req.session.save((err) => {
            if (err) console.error("Eroare la salvarea sesiunii:", err);
            resolve();
          });
        });
      }

      // Exclude parola din răspuns
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        user: userWithoutPassword,
        organization: newOrg,
      });
    } catch (error: any) {
      console.error("Eroare completă proces înregistrare:", error);
      return res.status(500).json({
        message: "Nu s-a putut înregistra utilizatorul",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  // Ruta pentru autentificare este gestionată de /server/auth.ts

  // Ruta pentru crearea organizației
  app.post("/api/organizations", async (req, res) => {
    try {
      const { name, type } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          message: "Numele organizației și tipul sunt obligatorii",
        });
      }

      // Valida tipul organizației
      if (!["freelancer", "agency", "company"].includes(type)) {
        return res.status(400).json({
          message:
            "Tipul organizației trebuie să fie 'freelancer', 'agency' sau 'company'",
        });
      }

      // Generează un slug unic din nume
      const slug =
        name
          .toLowerCase()
          .replace(/[^\w\s]/gi, "") // Îndepărtează caracterele speciale
          .replace(/\s+/g, "-") + // Înlocuiește spațiile cu cratime
        "-" +
        Date.now().toString().slice(-4); // Adaugă timestamp pentru unicitate

      // Inserează organizația în baza de date
      const organization = {
        name,
        slug,
        organization_type: type, // folosim numele corect al coloanei
        trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 zile
        subscription_plan: "trial",
        is_active: true,
      };
      
      console.log("Creare organizație:", organization);

      // Folosim PostgreSQL direct pentru inserare
      const newOrgResult = await db`
        INSERT INTO organizations ${db(organization)}
        RETURNING *
      `;

      if (newOrgResult.length === 0) {
        throw new Error("Nu s-a putut crea organizația: Nu s-a returnat niciun rezultat");
      }

      return res.status(201).json(newOrgResult[0]);
    } catch (error: any) {
      console.error("Eroare server:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  // Rutele /api/me și /api/logout sunt gestionate de /server/auth.ts

  // --- Routes pentru entități ---

  // Client Routes
  app.get("/api/clients", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res.status(401).json({ message: "Neautorizat sau organizație nespecificată" });
      }

      const clients = await storage.getClientsByOrganization(user.organization_id);
      return res.status(200).json(clients);
    } catch (error: any) {
      console.error("Eroare la obținerea clienților:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res.status(401).json({ message: "Neautorizat sau organizație nespecificată" });
      }

      const clientId = parseInt(req.params.id);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID client invalid" });
      }

      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client negăsit" });
      }

      // Verificăm dacă clientul aparține organizației utilizatorului
      if (client.organization_id !== user.organization_id) {
        return res.status(403).json({ message: "Nu aveți acces la acest client" });
      }

      // Obținem proiectele asociate clientului
      const projects = await storage.getProjectsByClient(clientId);

      // Returnăm datele complete
      return res.status(200).json({
        client,
        projects,
        // În viitor, putem adăuga și alte date relevante, cum ar fi:
        // invoices: await storage.getInvoicesByClient(clientId),
        // contacts: await storage.getContactsByClient(clientId),
        // activities: await storage.getActivitiesByClient(clientId)
      });
    } catch (error: any) {
      console.error("Eroare la obținerea detaliilor clientului:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res.status(401).json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Adăugăm automat organization_id și created_by
      const clientData = {
        ...req.body,
        organization_id: user.organization_id,
        created_by: user.id
      };

      const newClient = await storage.createClient(clientData);
      return res.status(201).json(newClient);
    } catch (error: any) {
      console.error("Eroare la crearea clientului:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res.status(401).json({ message: "Neautorizat sau organizație nespecificată" });
      }

      const clientId = parseInt(req.params.id);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID client invalid" });
      }

      // Verificăm dacă clientul există și aparține organizației utilizatorului
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client negăsit" });
      }

      if (existingClient.organization_id !== user.organization_id) {
        return res.status(403).json({ message: "Nu aveți acces la acest client" });
      }

      // Actualizăm datele clientului
      const updatedClient = await storage.updateClient(clientId, req.body);
      return res.status(200).json(updatedClient);
    } catch (error: any) {
      console.error("Eroare la actualizarea clientului:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res.status(401).json({ message: "Neautorizat sau organizație nespecificată" });
      }

      const clientId = parseInt(req.params.id);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: "ID client invalid" });
      }

      // Verificăm dacă clientul există și aparține organizației utilizatorului
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client negăsit" });
      }

      if (existingClient.organization_id !== user.organization_id) {
        return res.status(403).json({ message: "Nu aveți acces la acest client" });
      }

      // Verificăm dacă există proiecte asociate sau alte dependențe
      const projects = await storage.getProjectsByClient(clientId);
      if (projects.length > 0) {
        return res.status(400).json({ 
          message: "Nu se poate șterge clientul deoarece are proiecte asociate",
          projects: projects.length
        });
      }

      // Ștergem clientul
      const deleted = await storage.deleteClient(clientId);
      if (!deleted) {
        return res.status(500).json({ message: "Ștergerea clientului a eșuat" });
      }

      return res.status(200).json({ message: "Client șters cu succes" });
    } catch (error: any) {
      console.error("Eroare la ștergerea clientului:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  // --- Routes pentru dashboard ---

  // Activity Log
  app.get("/api/activity-log", async (req, res) => {
    try {
      // Sample data for now - this would be fetched from the database
      res.json([
        {
          id: 1,
          userId: 1,
          userName: "Alexandru Popescu",
          userInitials: "AP",
          actionType: "adăugare",
          actionDescription: "a adăugat un nou",
          entityType: "client",
          entityId: 101,
          entityName: "Innovate SRL",
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: 2,
          userId: 2,
          userName: "Maria Ionescu",
          userInitials: "MI",
          actionType: "modificare",
          actionDescription: "a actualizat",
          entityType: "project",
          entityId: 34,
          entityName: "Redesign website",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 3,
          userId: 1,
          userName: "Alexandru Popescu",
          userInitials: "AP",
          actionType: "atribuire",
          actionDescription: "a atribuit",
          entityType: "task",
          entityId: 78,
          entityName: "Actualizare SEO",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
        },
        {
          id: 4,
          userId: 3,
          userName: "Elena Vasilescu",
          userInitials: "EV",
          actionType: "adăugare",
          actionDescription: "a adăugat o nouă",
          entityType: "invoice",
          entityId: 56,
          entityName: "INV-2023-056",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
        },
        {
          id: 5,
          userId: 2,
          userName: "Maria Ionescu",
          userInitials: "MI",
          actionType: "ștergere",
          actionDescription: "a șters",
          entityType: "task",
          entityId: 92,
          entityName: "Testare contact form",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ]);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ error: "Eroare la obținerea datelor jurnalului de activitate" });
    }
  });

  // Statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      // Sample data - would be calculated from the database
      res.json({
        clientsCount: 28,
        projectsCount: 12,
        activeTasksCount: 43,
        invoicesValue: 57800,
        totalRevenue: 238500,
        averageProjectValue: 19875,
        clientsIncrease: 12,
        projectsIncrease: 8,
        revenueIncrease: 15
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Eroare la obținerea statisticilor" });
    }
  });

  // Project Status
  app.get("/api/projects/status", async (req, res) => {
    try {
      // Sample data - would be calculated from the database
      res.json([
        { name: "În progres", value: 7, color: "#3b82f6" },
        { name: "Completate", value: 12, color: "#22c55e" },
        { name: "În așteptare", value: 4, color: "#f97316" },
        { name: "Anulate", value: 2, color: "#ef4444" }
      ]);
    } catch (error) {
      console.error("Error fetching project status:", error);
      res.status(500).json({ error: "Eroare la obținerea statusului proiectelor" });
    }
  });

  // Invoices Data
  app.get("/api/invoices/summary", async (req, res) => {
    try {
      // Sample data - would be calculated from the database
      res.json([
        { name: "Ian", paid: 15000, unpaid: 5000, overdue: 2000 },
        { name: "Feb", paid: 18000, unpaid: 8000, overdue: 1500 },
        { name: "Mar", paid: 22000, unpaid: 6000, overdue: 3000 },
        { name: "Apr", paid: 19000, unpaid: 7000, overdue: 2500 },
        { name: "Mai", paid: 23000, unpaid: 9000, overdue: 4000 },
        { name: "Iun", paid: 25000, unpaid: 7500, overdue: 2000 }
      ]);
    } catch (error) {
      console.error("Error fetching invoices data:", error);
      res.status(500).json({ error: "Eroare la obținerea datelor despre facturi" });
    }
  });

  // Upcoming Tasks
  app.get("/api/tasks/upcoming", async (req, res) => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Sample data - would be fetched from the database
      res.json([
        {
          id: 1,
          title: "Finalizare design homepage",
          description: "Completare design pentru pagina principală",
          dueDate: tomorrow,
          projectId: 1,
          projectName: "Redesign website Clisoft",
          status: "În lucru",
          priority: "high",
          progress: 75
        },
        {
          id: 2,
          title: "Implementare API plăți",
          description: "Integrare Stripe pentru procesare plăți",
          dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
          projectId: 2,
          projectName: "Platformă e-commerce MegaShop",
          status: "În lucru",
          priority: "urgent",
          progress: 40
        },
        {
          id: 3,
          title: "Creare conținut blog",
          dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
          projectId: 1,
          projectName: "Redesign website Clisoft",
          status: "Neînceput",
          priority: "medium",
          progress: 0
        },
        {
          id: 4,
          title: "Optimizare SEO On-Page",
          description: "Îmbunătățire titluri și meta descrieri",
          dueDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
          projectId: 3,
          projectName: "Marketing digital FastTech",
          status: "În întârziere",
          priority: "high",
          progress: 30
        },
        {
          id: 5,
          title: "Testare compatibilitate browsere",
          dueDate: nextWeek,
          projectId: 2,
          projectName: "Platformă e-commerce MegaShop",
          status: "Neînceput",
          priority: "low",
          progress: 0
        }
      ]);
    } catch (error) {
      console.error("Error fetching upcoming tasks:", error);
      res.status(500).json({ error: "Eroare la obținerea task-urilor apropiate" });
    }
  });

  // Time Tracking Data
  app.get("/api/time-tracking/summary", async (req, res) => {
    try {
      const today = new Date();
      
      // Generate dates for last 7 days
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('ro-RO', { weekday: 'short' });
      });
      
      // Sample data - would be calculated from the database
      res.json([
        { date: dates[0], hours: 6, billable: 5, nonBillable: 1 },
        { date: dates[1], hours: 7.5, billable: 6.5, nonBillable: 1 },
        { date: dates[2], hours: 8, billable: 7, nonBillable: 1 },
        { date: dates[3], hours: 6.5, billable: 5.5, nonBillable: 1 },
        { date: dates[4], hours: 9, billable: 8, nonBillable: 1 },
        { date: dates[5], hours: 7, billable: 6, nonBillable: 1 },
        { date: dates[6], hours: 4, billable: 3, nonBillable: 1 }
      ]);
    } catch (error) {
      console.error("Error fetching time tracking data:", error);
      res.status(500).json({ error: "Eroare la obținerea datelor de time tracking" });
    }
  });

  // Upcoming Events
  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Sample data - would be fetched from the database
      res.json([
        {
          id: 1,
          title: "Ședință kickoff proiect Innova",
          description: "Discuții inițiale și planificare proiect",
          startDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
          endDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
          location: "Sala de conferințe",
          type: "meeting"
        },
        {
          id: 2,
          title: "Termen limită livrare design Optitech",
          startDate: tomorrow,
          type: "deadline"
        },
        {
          id: 3,
          title: "Call prezentare concept MegaShop",
          startDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
          endDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
          location: "Online - Google Meet",
          type: "meeting"
        },
        {
          id: 4,
          title: "Plată factură Softdev",
          description: "Factură servicii hosting INV-2023-045",
          startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
          type: "payment"
        },
        {
          id: 5,
          title: "Follow-up client Medico",
          description: "Verificare satisfacție client după livrare",
          startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
          endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 30 * 60 * 1000),
          type: "reminder"
        }
      ]);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ error: "Eroare la obținerea evenimentelor apropiate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
