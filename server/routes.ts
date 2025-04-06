import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import "express-session";
import { storage } from "./storage";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { registrationSchema } from "../shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware de autorizare pentru a verifica dacă utilizatorul este autentificat și are organizație
  const requireAuth = async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Adăugăm utilizatorul și organizația la request pentru a fi folosite mai târziu
      req.user = user;

      next();
    } catch (error: any) {
      console.error("Eroare la autorizare:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  };

  // Configurăm autentificarea
  setupAuth(app);

  // Importăm și înregistrăm rutele API
  // Folosim importurile dinamice pentru a evita eroarea "require is not defined"
  const { default: clientsRouter } = await import("./api/clients");
  const { default: projectsRouter } = await import("./api/projects");
  const { default: tasksRouter } = await import("./api/tasks");
  const { default: reportsRouter } = await import("./api/reports");
  const {
    getAutomations,
    getAutomationById,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    getAutomationLogs,
  } = await import("./api/automations");

  app.use("/api/clients", clientsRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/reports", reportsRouter);

  // Rute pentru automatizări
  app.get("/api/automations", requireAuth, getAutomations);
  app.get("/api/automations/:id", requireAuth, getAutomationById);
  app.post("/api/automations", requireAuth, createAutomation);
  app.patch("/api/automations/:id", requireAuth, updateAutomation);
  app.delete("/api/automations/:id", requireAuth, deleteAutomation);
  app.get("/api/automation-logs", requireAuth, getAutomationLogs);
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
        usersExample: usersData,
      });
    } catch (error: any) {
      console.error("Eroare la obținerea informațiilor despre schemă:", error);
      res.status(500).json({
        success: false,
        error:
          error.message || "Eroare la obținerea informațiilor despre schemă",
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
        console.log(
          "Date invalide pentru înregistrare:",
          validationResult.error.format(),
        );
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
      console.log("Verificare schemă tabele înainte de inserare...");
      const schemaColumns = await db`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'organizations'
        ORDER BY ordinal_position
      `;

      console.log("Structura tabelei organizations:", schemaColumns);
      console.log("Se încearcă crearea organizației cu datele:", organization);

      // Folosim clientul PostgreSQL direct pentru inserare
      const newOrgResult = await db`
        INSERT INTO organizations ${db(organization)}
        RETURNING *
      `;

      if (!newOrgResult || newOrgResult.length === 0) {
        throw new Error(
          "Nu s-a putut crea organizația: Nu s-a returnat niciun rezultat",
        );
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
        throw new Error(
          "Nu s-a putut crea organizația: Nu s-a returnat niciun rezultat",
        );
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
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      const clients = await storage.getClientsByOrganization(
        user.organization_id,
      );
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

      console.log()
      
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Adaug logging extins pentru depanare
      console.log(
        "DEBUG ROUTES - API /clients/:id - tipul id-ului din params:",
        typeof req.params.id,
        "valoare:",
        req.params.id,
      );
      console.log(
        "DEBUG ROUTES - API /clients/:id - user.organization_id:",
        user.organization_id,
        "tip:",
        typeof user.organization_id,
      );

      // Convertim ID-ul la număr prin metoda Number() mai robustă și verificăm validitatea
      let clientId: number;
      try {
        clientId = Number(req.params.id);
        if (isNaN(clientId) || clientId <= 0 || !Number.isInteger(clientId)) {
          console.log(
            "DEBUG ROUTES - API /clients/:id - ID invalid:",
            req.params.id,
          );
          return res.status(400).json({ message: "ID client invalid" });
        }
      } catch (err) {
        console.error(
          "DEBUG ROUTES - API /clients/:id - Eroare la conversia ID-ului:",
          err,
        );
        return res.status(400).json({ message: "ID client invalid" });
      }

      console.log(
        "DEBUG ROUTES - API /clients/:id - clientId convertit:",
        clientId,
        "tip:",
        typeof clientId,
      );

      const client = await storage.getClient(clientId);
      console.log(
        "DEBUG ROUTES - API /clients/:id - client returnat:",
        client ? "găsit" : "negăsit",
        client
          ? `ID=${client.id}, organization_id=${client.organization_id}`
          : "",
      );

      if (!client) {
        return res.status(404).json({ message: "Client negăsit" });
      }

      // Verificăm tipurile și valorile pentru comparare
      console.log(
        "DEBUG ROUTES - API /clients/:id - Comparare: client.organization_id =",
        client.organization_id,
        "(tip:",
        typeof client.organization_id,
        ") user.organization_id =",
        user.organization_id,
        "(tip:",
        typeof user.organization_id,
        ")",
      );
      console.log(
        "DEBUG ROUTES - API /clients/:id - Sunt egale?",
        client.organization_id === user.organization_id,
      );
      console.log(
        "DEBUG ROUTES - API /clients/:id - După conversie:",
        Number(client.organization_id) === Number(user.organization_id),
      );

      // Verificăm dacă clientul aparține organizației utilizatorului - forțăm conversia la număr pentru a evita probleme de tip
      if (Number(client.organization_id) !== Number(user.organization_id)) {
        console.log(
          "DEBUG ROUTES - API /clients/:id - Acces refuzat: organizații diferite",
        );
        return res
          .status(403)
          .json({ message: "Nu aveți acces la acest client" });
      }

      console.log(
        "DEBUG ROUTES - API /clients/:id - Verificare trecută, clientul aparține organizației utilizatorului",
      );

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
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Adăugăm automat organization_id și created_by
      const clientData = {
        ...req.body,
        organization_id: user.organization_id,
        created_by: user.id,
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
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
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

      console.log("Existing client: ", existingClient);
      console.log("user: ", user);

      if (existingClient.organization_id !== user.organization_id) {
        return res
          .status(403)
          .json({ message: "Nu aveți acces la acest client" });
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
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
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
        return res
          .status(403)
          .json({ message: "Nu aveți acces la acest client" });
      }

      // Verificăm dacă există proiecte asociate sau alte dependențe
      const projects = await storage.getProjectsByClient(clientId);
      if (projects.length > 0) {
        return res.status(400).json({
          message: "Nu se poate șterge clientul deoarece are proiecte asociate",
          projects: projects.length,
        });
      }

      // Ștergem clientul
      const deleted = await storage.deleteClient(clientId);
      if (!deleted) {
        return res
          .status(500)
          .json({ message: "Ștergerea clientului a eșuat" });
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
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Folosim storage pentru a obține log-urile de activitate din baza de date pentru organizația curentă
      const activityLogs = await storage.getActivityLogsByOrganization(
        user.organization_id,
        10,
      );

      // Pentru fiecare înregistrare, obținem și informațiile despre utilizator
      const logsWithUserDetails = await Promise.all(
        activityLogs.map(async (log) => {
          const actionUser = await storage.getUser(log.user_id);

          // Generăm inițialele din numele utilizatorului
          const firstName = actionUser?.first_name || "";
          const lastName = actionUser?.last_name || "";
          const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`;

          return {
            id: log.id,
            userId: log.user_id,
            userName: `${firstName} ${lastName}`.trim(),
            userInitials: userInitials,
            actionType: log.action_type,
            actionDescription: log.action,
            entityType: log.entity_type,
            entityId: log.entity_id,
            entityName:
              log.entity_name || `${log.entity_type} #${log.entity_id}`,
            timestamp: log.created_at,
          };
        }),
      );

      res.json(logsWithUserDetails);
    } catch (error) {
      console.error("Eroare la obținerea jurnalului de activitate:", error);
      res
        .status(500)
        .json({
          error: "Eroare la obținerea datelor jurnalului de activitate",
        });
    }
  });

  // Statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Obținem toate datele necesare din baza de date
      const clients = await storage.getClientsByOrganization(
        user.organization_id,
      );
      const projects = await storage.getProjectsByOrganization(
        user.organization_id,
      );
      const tasks = await storage.getTasksByOrganization(user.organization_id);
      const invoices = await storage.getInvoicesByOrganization(
        user.organization_id,
      );

      // Calculăm statisticile pentru clienți
      const clientsCount = clients.length;

      // Calculăm statisticile pentru proiecte
      const projectsCount = projects.length;
      const activeProjects = projects.filter(
        (p) => p.status === "in_progress" || p.status === "active",
      );
      const activeProjectsCount = activeProjects.length;

      // Calculăm statisticile pentru task-uri
      const activeTasks = tasks.filter(
        (t) => t.status !== "completed" && t.status !== "cancelled",
      );
      const activeTasksCount = activeTasks.length;

      // Calculăm statisticile pentru facturi
      const invoicesValue = invoices.reduce(
        (sum, invoice) => sum + (invoice.total_amount || 0),
        0,
      );
      const paidInvoices = invoices.filter((i) => i.status === "paid");
      const totalRevenue = paidInvoices.reduce(
        (sum, invoice) => sum + (invoice.total_amount || 0),
        0,
      );

      // Calculăm valoarea medie a proiectelor
      const averageProjectValue =
        projectsCount > 0
          ? Math.round(
              projects.reduce(
                (sum, project) => sum + (project.budget || 0),
                0,
              ) / projectsCount,
            )
          : 0;

      // Pentru creșteri, ar trebui să avem date istorice - în acest moment vom folosi valori hardcodate
      // În viitor, acestea ar trebui să fie calculate pe baza datelor din ultimele luni
      const clientsIncrease = 0;
      const projectsIncrease = 0;
      const revenueIncrease = 0;

      res.json({
        clientsCount,
        projectsCount,
        activeProjectsCount,
        activeTasksCount,
        invoicesValue,
        totalRevenue,
        averageProjectValue,
        clientsIncrease,
        projectsIncrease,
        revenueIncrease,
      });
    } catch (error) {
      console.error("Eroare la obținerea statisticilor:", error);
      res.status(500).json({ error: "Eroare la obținerea statisticilor" });
    }
  });

  // Project Status
  app.get("/api/projects/status", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Obținem toate proiectele organizației
      const projects = await storage.getProjectsByOrganization(
        user.organization_id,
      );

      // Definim culorile statusurilor
      const statusColors = {
        in_progress: "#3b82f6", // albastru - în progres
        active: "#3b82f6", // albastru - activ
        completed: "#22c55e", // verde - completat
        on_hold: "#f97316", // portocaliu - în așteptare
        pending: "#f97316", // portocaliu - în așteptare
        cancelled: "#ef4444", // roșu - anulat
        archived: "#94a3b8", // gri - arhivat
      };

      // Traducem statusurile pentru interfața în limba română
      const statusNames = {
        in_progress: "În progres",
        active: "Activ",
        completed: "Completat",
        on_hold: "În așteptare",
        pending: "În așteptare",
        cancelled: "Anulat",
        archived: "Arhivat",
      };

      // Grupăm proiectele după status
      const statusGroups = projects.reduce((acc, project) => {
        const status = project.status || "pending";
        if (!acc[status]) {
          acc[status] = 0;
        }
        acc[status]++;
        return acc;
      }, {});

      // Convertim în formatul așteptat de frontend
      const statusData = Object.entries(statusGroups).map(
        ([status, count]) => ({
          name: statusNames[status] || status,
          value: count,
          color: statusColors[status] || "#94a3b8",
        }),
      );

      res.json(statusData);
    } catch (error) {
      console.error(
        "Eroare la obținerea statisticilor de status proiecte:",
        error,
      );
      res
        .status(500)
        .json({ error: "Eroare la obținerea statusului proiectelor" });
    }
  });

  // Invoices Data
  app.get("/api/invoices/summary", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Obținem toate facturile organizației
      const invoices = await storage.getInvoicesByOrganization(
        user.organization_id,
      );

      // Definim numele lunilor în română
      const monthNames = [
        "Ian",
        "Feb",
        "Mar",
        "Apr",
        "Mai",
        "Iun",
        "Iul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Obținem data curentă și calculăm luna de început pentru analiza ultimelor 6 luni
      const today = new Date();
      const startMonth = new Date(today.getFullYear(), today.getMonth() - 5, 1);

      // Creăm o structură pentru a ține sumarul lunar
      const monthlySummary = {};

      // Inițializăm structura pentru ultimele 6 luni
      for (let i = 0; i < 6; i++) {
        const month = new Date(
          startMonth.getFullYear(),
          startMonth.getMonth() + i,
          1,
        );
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
        const monthName = monthNames[month.getMonth()];

        monthlySummary[monthKey] = {
          name: monthName,
          paid: 0,
          unpaid: 0,
          overdue: 0,
          month: month.getMonth(),
          year: month.getFullYear(),
        };
      }

      // Parcurgem facturile și le grupăm pe luni
      invoices.forEach((invoice) => {
        if (!invoice.issue_date) return;

        const invoiceDate = new Date(invoice.issue_date);
        const monthKey = `${invoiceDate.getFullYear()}-${invoiceDate.getMonth() + 1}`;

        // Verificăm dacă luna este în perioada analizată
        if (monthlySummary[monthKey]) {
          const amount = invoice.total_amount || 0;

          // Clasificăm factura în funcție de status
          if (invoice.status === "paid") {
            monthlySummary[monthKey].paid += amount;
          } else if (
            invoice.status === "overdue" ||
            (invoice.due_date && new Date(invoice.due_date) < today)
          ) {
            monthlySummary[monthKey].overdue += amount;
          } else {
            monthlySummary[monthKey].unpaid += amount;
          }
        }
      });

      // Convertim obiectul în array și sortăm după an și lună
      const result = Object.values(monthlySummary).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      res.json(result);
    } catch (error) {
      console.error("Eroare la obținerea datelor despre facturi:", error);
      res
        .status(500)
        .json({ error: "Eroare la obținerea datelor despre facturi" });
    }
  });

  // Upcoming Tasks
  app.get("/api/tasks/upcoming", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Obținem toate task-urile organizației
      const tasks = await storage.getTasksByOrganization(user.organization_id);

      // Obținem toate proiectele organizației pentru a face legătura cu numele proiectelor
      const projects = await storage.getProjectsByOrganization(
        user.organization_id,
      );
      const projectsMap = projects.reduce((map, project) => {
        map[project.id] = project;
        return map;
      }, {});

      const today = new Date();

      // Funcție helper pentru a valida și converti datele în formate de timp valide
      const safeDate = (dateStr: string | null | undefined): Date | null => {
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        } catch (e) {
          console.error(`Eroare la conversia datei ${dateStr}:`, e);
          return null;
        }
      };

      // Filtrăm pentru a include doar task-urile necompletate cu deadline în viitor sau recent expirate
      // Și le sortăm după data limită
      const upcomingTasks = tasks
        .filter(
          (task) => {
            // Excludem task-urile care au fost completate sau anulate
            if (task.status === "completed" || task.status === "cancelled") return false;
            
            // Verificăm dacă task-ul are o dată limită validă
            const dueDate = safeDate(task.due_date);
            if (!dueDate) return false;
            
            // Includem doar task-urile cu deadline în următoarele 14 zile sau expirate recent (ultima săptămână)
            const pastThreshold = today.getTime() - 7 * 24 * 60 * 60 * 1000;
            const futureThreshold = today.getTime() + 14 * 24 * 60 * 60 * 1000;
            return dueDate.getTime() > pastThreshold && dueDate.getTime() < futureThreshold;
          }
        )
        .sort((a, b) => {
          const dateA = safeDate(a.due_date);
          const dateB = safeDate(b.due_date);
          
          // Dacă una dintre date este invalidă, o punem la sfârșit
          if (!dateA) return 1;
          if (!dateB) return -1;
          
          return dateA.getTime() - dateB.getTime();
        })
        // Luăm doar primele 5 task-uri
        .slice(0, 5);

      // Traducem statusurile pentru interfața în limba română
      const statusTranslations = {
        not_started: "Neînceput",
        in_progress: "În lucru",
        on_hold: "În așteptare",
        completed: "Completat",
        cancelled: "Anulat",
        delayed: "În întârziere",
      };

      // Traducem prioritățile pentru interfața în limba română
      const priorityTranslations = {
        low: "scăzută",
        medium: "medie",
        high: "ridicată",
        urgent: "urgentă",
      };

      // Transformăm datele în formatul așteptat de frontend
      const formattedTasks = upcomingTasks.map((task) => {
        const project = projectsMap[task.project_id];
        const projectName = project
          ? project.name
          : `Proiect #${task.project_id}`;

        // Determinăm statusul în funcție de data limită
        let displayStatus = statusTranslations[task.status] || task.status;
        if (
          task.due_date &&
          new Date(task.due_date).getTime() < today.getTime() &&
          task.status !== "completed"
        ) {
          displayStatus = "În întârziere";
        }

        return {
          id: task.id,
          title: task.title,
          description: task.description || "",
          dueDate: task.due_date,
          projectId: task.project_id,
          projectName: projectName,
          status: displayStatus,
          priority: priorityTranslations[task.priority] || task.priority,
          progress: task.progress || 0,
        };
      });

      res.json(formattedTasks);
    } catch (error) {
      console.error("Eroare la obținerea task-urilor apropiate:", error);
      res
        .status(500)
        .json({ error: "Eroare la obținerea task-urilor apropiate" });
    }
  });

  // Time Tracking Data
  app.get("/api/time-tracking/summary", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      // Obținem toate înregistrările de timp din organizație
      let timeLogs = await storage.getTimeLogsByUser(user.id);

      // Dacă utilizatorul are rol de admin sau manager, obținem datele pentru întreaga organizație
      if (
        user.role === "admin" ||
        user.role === "manager" ||
        user.role === "ceo"
      ) {
        timeLogs = await Promise.all(
          (await storage.getUsersByOrganization(user.organization_id)).flatMap(
            async (orgUser) => await storage.getTimeLogsByUser(orgUser.id),
          ),
        );
      }

      const today = new Date();

      // Calculăm data de început (7 zile în urmă)
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      // Generăm zilele pentru ultimele 7 zile
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return {
          date: date.toLocaleDateString("ro-RO", { weekday: "short" }),
          fullDate: new Date(date),
          hours: 0,
          billable: 0,
          nonBillable: 0,
        };
      });

      // Creăm un Map pentru a facilita căutarea zilei după data completă
      const daysMap = new Map();
      days.forEach((day) => {
        const dateKey = day.fullDate.toISOString().split("T")[0];
        daysMap.set(dateKey, day);
      });

      // Procesăm înregistrările de timp pentru fiecare zi
      if (Array.isArray(timeLogs)) {
        timeLogs.flat().forEach((log) => {
          if (!log.start_time) return;

          // Convertim la dată locală și extragem doar data (fără timp)
          const logDate = new Date(log.start_time);
          const dateKey = logDate.toISOString().split("T")[0];

          // Dacă data este în intervalul nostru
          if (daysMap.has(dateKey)) {
            const day = daysMap.get(dateKey);

            // Calculăm orele înregistrate
            const durationHours = (log.duration || 0) / 60; // conversia din minute în ore

            // Actualizăm sumarul zilei
            day.hours += durationHours;

            if (log.billable) {
              day.billable += durationHours;
            } else {
              day.nonBillable += durationHours;
            }
          }
        });
      }

      // Rotunjim valorile pentru o afișare mai plăcută
      days.forEach((day) => {
        day.hours = parseFloat(day.hours.toFixed(1));
        day.billable = parseFloat(day.billable.toFixed(1));
        day.nonBillable = parseFloat(day.nonBillable.toFixed(1));

        // Eliminăm proprietatea fullDate care nu este necesară în răspuns
        delete day.fullDate;
      });

      res.json(days);
    } catch (error) {
      console.error("Eroare la obținerea datelor de time tracking:", error);
      res
        .status(500)
        .json({ error: "Eroare la obținerea datelor de time tracking" });
    }
  });

  // Upcoming Events
  app.get("/api/events/upcoming", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user || !user.organization_id) {
        return res
          .status(401)
          .json({ message: "Neautorizat sau organizație nespecificată" });
      }

      const organizationId = user.organization_id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Inițializăm array-ul pentru evenimente
      const events = [];

      // Obținem task-urile din baza de date pentru a identifica deadline-uri
      const tasks = await storage.getTasksByOrganization(organizationId);
      const projects = await storage.getProjectsByOrganization(organizationId);
      const projectsMap = projects.reduce((map, project) => {
        map[project.id] = project;
        return map;
      }, {});

      // Funcție helper pentru a valida și converti datele în formate de timp valide
      const safeDate = (dateStr: string | null | undefined): Date | null => {
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        } catch (e) {
          console.error(`Eroare la conversia datei ${dateStr}:`, e);
          return null;
        }
      };

      // Filtrăm task-urile și le convertim în evenimente de tip deadline
      const taskDeadlines = tasks
        .filter(task => {
          // Excludem task-urile care au fost completate sau anulate
          if (task.status === "completed" || task.status === "cancelled") return false;
          
          // Verificăm dacă task-ul are o dată limită validă
          const dueDate = safeDate(task.due_date);
          if (!dueDate) return false;
          
          // Includem doar task-urile cu deadline în următoarele 14 zile
          const futureThreshold = today.getTime() + 14 * 24 * 60 * 60 * 1000;
          return dueDate > today && dueDate.getTime() < futureThreshold;
        })
        .map((task) => {
          const project = projectsMap[task.project_id];
          const projectName = project
            ? project.name
            : `Proiect #${task.project_id}`;

          return {
            id: `task-${task.id}`,
            title: `Deadline: ${task.title}`,
            description:
              task.description ||
              `Termen limită pentru task din proiectul ${projectName}`,
            startDate: new Date(task.due_date),
            type: "deadline",
            relatedEntityType: "task",
            relatedEntityId: task.id,
          };
        });

      events.push(...taskDeadlines);

      // Obținem facturile din baza de date pentru a identifica date de plată
      const invoices = await storage.getInvoicesByOrganization(organizationId);

      // Filtrăm facturile și le convertim în evenimente de tip plată
      const invoicePayments = invoices
        .filter(invoice => {
          // Excludem facturile care au fost plătite sau anulate
          if (invoice.status === "paid" || invoice.status === "cancelled") return false;
          
          // Verificăm dacă factura are o dată scadentă validă
          const dueDate = safeDate(invoice.due_date);
          if (!dueDate) return false;
          
          // Includem doar facturile cu scadență în următoarele 14 zile
          const futureThreshold = today.getTime() + 14 * 24 * 60 * 60 * 1000;
          return dueDate > today && dueDate.getTime() < futureThreshold;
        })
        .map((invoice) => {
          return {
            id: `invoice-${invoice.id}`,
            title: `Plată: ${invoice.invoice_number || `Factură #${invoice.id}`}`,
            description: `Plată factură ${invoice.total_amount ? `în valoare de ${invoice.total_amount} ${invoice.currency || "RON"}` : ""}`,
            startDate: new Date(invoice.due_date),
            type: "payment",
            relatedEntityType: "invoice",
            relatedEntityId: invoice.id,
          };
        });

      events.push(...invoicePayments);

      // Adăugăm întâlniri sau alte evenimente programate (ar trebui să vină din tabela events)
      try {
        const calendarEvents = await db`
          SELECT * FROM events 
          WHERE organization_id = ${organizationId}
          AND start_date > ${today}
          AND start_date < ${new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)}
          ORDER BY start_date ASC
        `;

        if (calendarEvents && calendarEvents.length > 0) {
          const formattedEvents = calendarEvents.map((event) => ({
            id: `event-${event.id}`,
            title: event.title,
            description: event.description,
            startDate: new Date(event.start_date),
            endDate: event.end_date ? new Date(event.end_date) : undefined,
            location: event.location,
            type: event.event_type || "meeting",
            relatedEntityType: event.related_entity_type,
            relatedEntityId: event.related_entity_id,
          }));

          events.push(...formattedEvents);
        }
      } catch (error) {
        console.log(
          "Nu s-au putut încărca evenimentele din calendar:",
          error.message,
        );
        // Continuăm execuția chiar dacă nu avem evenimente din calendar
      }

      // Sortăm toate evenimentele după dată
      events.sort((a, b) => {
        try {
          // Validăm și comparăm datele
          const dateA = new Date(a.startDate);
          const dateB = new Date(b.startDate);
          
          // Verificăm dacă datele sunt valide
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1; // a e invalid, b ar trebui să fie primul
          if (isNaN(dateB.getTime())) return -1; // b e invalid, a ar trebui să fie primul
          
          return dateA.getTime() - dateB.getTime();
        } catch (error) {
          console.error("Eroare la sortarea evenimentelor:", error);
          return 0; // În caz de eroare, nu schimbăm ordinea
        }
      });

      // Returnăm primele 5 evenimente
      res.json(events.slice(0, 5));
    } catch (error) {
      console.error("Eroare la obținerea evenimentelor apropiate:", error);
      res
        .status(500)
        .json({ error: "Eroare la obținerea evenimentelor apropiate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
