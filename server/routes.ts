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

  const httpServer = createServer(app);
  return httpServer;
}
