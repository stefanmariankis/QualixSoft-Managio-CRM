// Încarcă variabilele de mediu din fișierul .env
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Versiuni constante
const API_VERSION = "1.0.0";
const MANAGIO_VERSION = "1.2.0";

// Modifică configurația portului
const PORT = process.env.PORT || 3000;

// Afișează variabilele de mediu importante pentru depanare
console.log("Variabile de mediu:");
console.log("- DATABASE_URL: " + (process.env.DATABASE_URL ? "Setat (valoare ascunsă)" : "NESETAT"));
console.log("- SESSION_SECRET: " + (process.env.SESSION_SECRET ? "Setat" : "NESETAT"));
console.log("- PORT: " + (PORT || "3000 (default)"));
console.log("- NODE_ENV: " + (process.env.NODE_ENV || "development (default)"));

const app = express();

// Setări CORS pentru a permite cereri de la domeniul frontend-ului
app.use(cors({
  origin: ['https://managio.ro', 'http://managio.ro', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware pentru logare cereri API și răspunsuri
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Rută de informații API
app.get('/', (req, res) => {
  res.json({ 
    message: 'ManagioSync API este funcțional!',
    version: API_VERSION,
    managioVersion: MANAGIO_VERSION 
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: API_VERSION
  });
});

(async () => {
  const server = await registerRoutes(app);

  // Middleware global pentru gestionarea erorilor
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Eroare server:", err);
  });

  // Configurează mediul de dezvoltare cu Vite
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
    
    // Catch all pentru SPA
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
