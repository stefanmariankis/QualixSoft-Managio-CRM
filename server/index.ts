// Încarcă variabilele de mediu din fișierul .env
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';

// Versiuni constante
const API_VERSION = "1.0.0";
const MANAGIO_VERSION = "1.2.0";

// Afișează variabilele de mediu importante pentru depanare
console.log("Variabile de mediu:");
console.log("- DATABASE_URL: " + (process.env.DATABASE_URL ? "Setat (valoare ascunsă)" : "NESETAT"));
console.log("- SESSION_SECRET: " + (process.env.SESSION_SECRET ? "Setat" : "NESETAT"));
console.log("- PORT: " + (process.env.PORT || "5000 (default)"));
console.log("- NODE_ENV: " + (process.env.NODE_ENV || "development (default)"));

const app = express();

// Setări CORS pentru a permite cereri de la domeniul frontend-ului
const allowedOrigins = [
  'https://managio.ro',                      // Domeniul principal
  'https://www.managio.ro',                  // Subdomeniu www
  'https://app.managio.ro',                  // Subdomeniu aplicație
  'http://localhost:5173',                   // Dezvoltare locală - Vite
  'http://localhost:3000',                   // Dezvoltare locală - port alternativ
];

// Adaugă domeniul Railway generat la lista de origini permise dacă suntem în producție
if (process.env.RAILWAY_STATIC_URL) {
  allowedOrigins.push(`https://${process.env.RAILWAY_STATIC_URL}`);
}

app.use(cors({
  origin: function(origin, callback) {
    // Permite cererile fără origine (cum ar fi apeluri API directe)
    if (!origin) return callback(null, true);
    
    // Verifică dacă originea este în lista de origini permise
    // sau dacă suntem în dezvoltare (permite toate în dev)
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Utilizează portul din variabila de mediu PORT sau valoarea implicită 5000
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server Managio pornit pe portul ${port} în mediul ${process.env.NODE_ENV || 'development'}`);
  });
})();
