import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase, pgClient } from "./db";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Definim schemele de validare direct aici (înlocuim Drizzle)
const loginSchema = z.object({
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  password: z.string().min(1, { message: "Parola este obligatorie" }),
  rememberMe: z.boolean().optional(),
});

const registrationSchema = z.object({
  firstName: z.string().min(1, { message: "Prenumele este obligatoriu" }),
  lastName: z.string().min(1, { message: "Numele este obligatoriu" }),
  email: z.string().email({ message: "Adresa de email nu este validă" }),
  password: z
    .string()
    .min(8, { message: "Parola trebuie să aibă minim 8 caractere" }),
  organizationType: z.enum(["freelancer", "agency", "company"], {
    errorMap: () => ({ message: "Tipul organizației este obligatoriu" }),
  }),
  companyName: z
    .string()
    .min(1, { message: "Numele organizației este obligatoriu" }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Trebuie să accepți termenii și condițiile",
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Rută de test
  app.get("/api/test", (req, res) => {
    return res.json({ success: true, message: "API funcționează corect" });
  });
  
  // Rută pentru a reîmprospăta cache-ul de schemă
  app.get("/api/refresh-schema", async (req, res) => {
    try {
      const { supabase, pgClient } = await import('./db');
      
      // Obține informații despre tabele pentru a reîmprospăta schema cache
      const { data: organizationsData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, logo, organization_type, subscription_plan')
        .limit(1);
        
      if (orgError) {
        console.error("Eroare la reîmprospătarea schemei pentru organizations:", orgError);
      }
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, organization_id')
        .limit(1);
        
      if (usersError) {
        console.error("Eroare la reîmprospătarea schemei pentru users:", usersError);
      }
      
      // Folosirea pg direct pentru a obține schema
      const queryResult = await pgClient`
        SELECT 
          table_name, 
          column_name,
          data_type 
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
          AND table_name IN ('organizations', 'users')
      `;
      
      console.log("Reîmprospătare cache schemă realizată");
      res.json({ 
        success: true, 
        schema: queryResult,
        organizationsExample: organizationsData,
        usersExample: usersData
      });
    } catch (error: any) {
      console.error("Eroare la reîmprospătarea cache-ului schemă:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Eroare la reîmprospătarea cache-ului schemă' 
      });
    }
  });
  // Ruta pentru înregistrare utilizator
  app.post("/api/register", async (req, res) => {
    try {
      // Validează datele de înregistrare
      const validationResult = registrationSchema.safeParse(req.body);

      if (!validationResult.success) {
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

      // Încercăm să forțăm resetarea cache-ului schemei înainte de inserare
      try {
        console.log('Reîmprospătare cache schemă pentru înregistrare...');
        await pgClient`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'organizations'
        `;
        
        // Verificăm și direct tabela organizations
        const { data: orgCheck, error: orgCheckError } = await supabase
          .from('organizations')
          .select('id')
          .limit(1);
          
        if (orgCheckError) {
          console.error('Eroare la verificarea tabelei organizations:', orgCheckError);
        } else {
          console.log('Tabel organizations accesat cu succes pentru înregistrare');
        }
      } catch (cacheError) {
        console.error('Eroare la reîmprospătarea cache-ului:', cacheError);
        // Continuăm execuția, poate va funcționa oricum
      }

      // Folosim Supabase pentru inserare cu explicații detaliate
      console.log("Se încearcă crearea organizației cu datele:", organization);
      
      // Utilizăm un obiect diferit, sperând că poate supabase va recunoaște structura
      const organizationInsert = {
        name: organization.name,
        slug: organization.slug,
        organization_type: organization.organization_type, // acesta e câmpul problematic
        subscription_plan: organization.subscription_plan,
        is_active: organization.is_active,
        trial_expires_at: organization.trial_expires_at
      };
      
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert(organizationInsert)
        .select()
        .single();

      if (orgError || !newOrg) {
        throw new Error(
          `Nu s-a putut crea organizația: ${orgError?.message || "Eroare necunoscută"}`,
        );
      }

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

      // Exclude parola din răspuns
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        user: userWithoutPassword,
        organization: newOrg,
      });
    } catch (error: any) {
      console.error("Eroare la înregistrarea utilizatorului:", error);
      return res.status(500).json({
        message: "Nu s-a putut înregistra utilizatorul",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  // Ruta pentru autentificare
  app.post("/api/login", async (req, res) => {
    try {
      // Validează datele de login
      const validationResult = loginSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Date invalide",
          errors: validationResult.error.format(),
        });
      }

      const { email, password } = validationResult.data;

      // Caută utilizatorul după email
      const user = await storage.getUserByUsername(email);

      if (!user) {
        return res.status(401).json({ message: "Email sau parolă incorecte" });
      }

      // Verifică parola
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email sau parolă incorecte" });
      }

      // Obține informațiile organizației
      let organization = null;
      if (user.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", user.organization_id)
          .single();

        organization = orgData;
      }

      // Exclude parola din răspuns
      const { password: _, ...userWithoutPassword } = user;

      // Aici ar trebui să setați sesiunea sau să generați un token JWT
      // Pentru simplitate, trimitem doar datele utilizatorului și organizației

      return res.status(200).json({
        user: userWithoutPassword,
        organization,
      });
    } catch (error: any) {
      console.error("Eroare la autentificare:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

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
      
      // Încercăm să forțăm resetarea cache-ului schemei înainte de inserare
      try {
        console.log('Reîmprospătare cache schemă...');
        await pgClient`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'organizations'
        `;
        
        // Verificăm și direct tabela organizations
        const { data: orgCheck, error: orgCheckError } = await supabase
          .from('organizations')
          .select('id')
          .limit(1);
          
        if (orgCheckError) {
          console.error('Eroare la verificarea tabelei organizations:', orgCheckError);
        } else {
          console.log('Tabel organizations accesat cu succes');
        }
      } catch (cacheError) {
        console.error('Eroare la reîmprospătarea cache-ului:', cacheError);
        // Continuăm execuția, poate va funcționa oricum
      }

      console.log("Creare organizație:", organization);

      // Folosim Supabase pentru inserare
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert(organization)
        .select()
        .single();

      if (orgError || !newOrg) {
        throw new Error(
          `Nu s-a putut crea organizația: ${orgError?.message || "Eroare necunoscută"}`,
        );
      }

      return res.status(201).json(newOrg);
    } catch (error: any) {
      console.error("Eroare server:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  // Ruta pentru a obține datele utilizatorului
  app.get("/api/me", async (req, res) => {
    try {
      // Aici ar trebui să verifici sesiunea sau token-ul JWT
      // Pentru simplitate, am comenta acest cod

      // În implementarea reală, veți avea acces la ID-ul utilizatorului din sesiune
      // const userId = req.session.userId;
      const userId = req.headers["user-id"]; // temporar pentru testare

      if (!userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(Number(userId));

      if (!user) {
        return res.status(404).json({ message: "Utilizator negăsit" });
      }

      // Obține informațiile organizației
      let organization = null;
      if (user.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", user.organization_id)
          .single();

        organization = orgData;
      }

      // Exclude parola din răspuns
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        user: userWithoutPassword,
        organization,
      });
    } catch (error: any) {
      console.error("Eroare la obținerea datelor utilizatorului:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
