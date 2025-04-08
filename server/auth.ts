import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { loginSchema, forgotPasswordSchema } from "../shared/schema";
import { db } from "./db";
import crypto from 'crypto';

// Adaugă proprietăți pentru session
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

// Secretul pentru sesiuni
const SESSION_SECRET = process.env.SESSION_SECRET || uuidv4();

// Configurarea middleware pentru sesiuni
export function setupAuth(app: Express) {
  // Configurare sesiuni
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === "production", // în producție, folosește doar HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 săptămână
        httpOnly: true,
      },
    })
  );

  // Middleware pentru rute protejate
  app.use("/api/me", requireAuth);
  app.use("/api/dashboard", requireAuth);
  app.use("/api/projects", requireAuth);
  app.use("/api/clients", requireAuth);
  app.use("/api/invoices", requireAuth);
  app.use("/api/templates", requireAuth);
  app.use("/api/user", requireAuth);
  app.use("/api/organization", requireAuth);
  app.use("/api/profile", requireAuth);

  // Handler pentru autentificare
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

      console.log('Info: ', user, validationResult.data)

      if (!user) {
        return res.status(401).json({ message: "Email sau parolă incorecte" });
      }

      // Verifică parola
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email sau parolă incorecte" });
      }

      // Setează sesiunea
      req.session.userId = user.id;
      await req.session.save();

      // Obține informațiile organizației
      let organization = null;
      if (user.organization_id) {
        
        const orgResults = await db`
          SELECT * FROM organizations
          WHERE id = ${user.organization_id}
          LIMIT 1
        `;

        if (orgResults.length > 0) {
          organization = orgResults[0];
        }
      }

      // Exclude parola din răspuns
      const { password: _, ...userWithoutPassword } = user;

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

  // Handler pentru delogare
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Eroare la distrugerea sesiunii:", err);
        return res.status(500).json({
          message: "Eroare la deconectare",
          error: err.message,
        });
      }

      // Șterge cookie-ul de sesiune
      res.clearCookie("connect.sid");
      
      return res.status(200).json({ message: "Deconectat cu succes" });
    });
  });

  // Handler pentru solicitarea resetării parolei
  app.post("/api/reset-password", async (req, res) => {
    try {
      // Validează adresa de email
      const validationResult = forgotPasswordSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Date invalide",
          errors: validationResult.error.format(),
        });
      }

      const { email } = validationResult.data;

      // Verifică dacă utilizatorul există
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        // Nu dezvăluim dacă utilizatorul există sau nu din motive de securitate
        // Returnăm success: true chiar dacă emailul nu există
        return res.status(200).json({ 
          success: true, 
          message: "Dacă adresa de email există în baza noastră de date, vei primi instrucțiuni pentru resetarea parolei." 
        });
      }

      // Generăm token securizat pentru resetarea parolei
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Setăm data expirării la 1 oră de acum
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

      // Actualizăm utilizatorul cu token-ul de resetare și data expirării
      // Notă: În viitor, vom adăuga coloanele pentru token în schema bazei de date
      // Deocamdată, simulăm acest comportament (token-ul nu este stocat)
      
      console.log(`[SIMULARE] Token resetare pentru ${email}: ${resetToken}`);
      console.log(`[SIMULARE] Expiră la: ${resetTokenExpires}`);
      
      // Aici s-ar trimite un email cu link-ul de resetare
      // De exemplu: https://managio.ro/reset-password?token=${resetToken}
      
      // Returnăm success
      return res.status(200).json({ 
        success: true, 
        message: "Dacă adresa de email există în baza noastră de date, vei primi instrucțiuni pentru resetarea parolei." 
      });
    } catch (error: any) {
      console.error("Eroare la solicitarea resetării parolei:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  // Handler pentru setarea noii parole (după reset)
  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!token || !password || password.length < 8) {
        return res.status(400).json({ 
          message: "Date invalide. Parola trebuie să aibă minim 8 caractere." 
        });
      }

      // Convertim token-ul din URL în hash pentru comparație
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // În viitor, vom căuta utilizatorul după token-ul de resetare
      // Deocamdată, simulăm acest comportament
      console.log(`[SIMULARE] Se verifică token-ul de resetare: ${token}`);
      console.log(`[SIMULARE] Hash-ul token-ului: ${resetTokenHash}`);
      
      // Simulăm că am găsit utilizatorul după token
      // În realitate, am verifica dacă token-ul există în baza de date și nu a expirat
      
      return res.status(200).json({ 
        success: true, 
        message: "Parola a fost resetată cu succes. Te poți autentifica acum cu noua parolă." 
      });
    } catch (error: any) {
      console.error("Eroare la resetarea parolei:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });

  // Handler pentru verificarea sesiunii
  app.get("/api/me", async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        // Utilizatorul a fost șters între timp
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Utilizator negăsit" });
      }

      // Obține informațiile organizației
      let organization = null;
      if (user.organization_id) {
        
        const orgResults = await db`
          SELECT * FROM organizations
          WHERE id = ${user.organization_id}
          LIMIT 1
        `;

        if (orgResults.length > 0) {
          organization = orgResults[0];
        }
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

  // Handler pentru actualizarea profilului utilizatorului
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const updates = req.body;
      
      // Verificăm ce câmpuri se pot actualiza
      const allowedFields = [
        'first_name', 'last_name', 'phone', 'position', 'bio', 
        'skills', 'hourly_rate', 'avatar_url'
      ];
      
      // Filtrăm doar câmpurile permise
      const filteredUpdates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (field in updates) {
          filteredUpdates[field] = updates[field];
        }
      }
      
      // Adăugăm data actualizării
      filteredUpdates.updated_at = new Date();
      
      // Actualizăm profilul utilizatorului
      const updatedUser = await storage.updateUser(userId, filteredUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilizator negăsit" });
      }
      
      // Exclude parola din răspuns
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json({
        user: userWithoutPassword,
        message: "Profil actualizat cu succes"
      });
    } catch (error: any) {
      console.error("Eroare la actualizarea profilului:", error);
      return res.status(500).json({
        message: "Eroare internă de server",
        error: error.message || "Eroare necunoscută",
      });
    }
  });
}

// Middleware pentru a verifica autentificarea și a încărca datele utilizatorului
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Neautorizat" });
  }
  
  try {
    // Încarcă utilizatorul și îl atașează la obiectul request
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      // Utilizatorul a fost șters între timp
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Utilizator negăsit" });
    }
    
    // Adaugă utilizatorul la request pentru a fi folosit în rutele API
    (req as any).user = user;
    
    next();
  } catch (error) {
    console.error("Eroare la încărcarea utilizatorului:", error);
    return res.status(500).json({ message: "Eroare internă de server" });
  }
}