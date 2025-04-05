import type { Express } from "express";
import { createServer, type Server } from "http";
import { createSupabaseClient } from "./supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  const supabase = createSupabaseClient();

  // Ruta pentru crearea organizației
  app.post("/api/organizations", async (req, res) => {
    try {
      const { name, type } = req.body;

      if (!name || !type) {
        return res.status(400).json({ 
          message: "Numele organizației și tipul sunt obligatorii" 
        });
      }

      // Valida tipul organizației
      if (!["freelancer", "agency", "company"].includes(type)) {
        return res.status(400).json({ 
          message: "Tipul organizației trebuie să fie 'freelancer', 'agency' sau 'company'" 
        });
      }

      // Inserează organizația în Supabase
      const { data, error } = await supabase
        .from("organizations")
        .insert([
          { company_name: name, organization_type: type }
        ])
        .select()
        .single();

      if (error) {
        console.error("Eroare la crearea organizației:", error);
        return res.status(500).json({ 
          message: "Nu s-a putut crea organizația", 
          error: error.message 
        });
      }

      return res.status(201).json(data);
    } catch (error) {
      console.error("Eroare server:", error);
      return res.status(500).json({ 
        message: "Eroare internă de server" 
      });
    }
  });

  // Ruta pentru a obține datele utilizatorului
  app.get("/api/me", async (req, res) => {
    try {
      // Se presupune că veți avea un middleware pentru sesiune
      // care va pune token-ul JWT în req
      const token = req.headers.authorization?.split("Bearer ")[1];

      if (!token) {
        return res.status(401).json({ message: "Neautorizat" });
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ message: "Sesiune invalidă" });
      }

      return res.json({ user });
    } catch (error) {
      console.error("Eroare la obținerea datelor utilizatorului:", error);
      return res.status(500).json({ message: "Eroare internă de server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
