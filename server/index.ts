import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from 'dotenv';
import cors from 'cors';
dotenv.config(); // Înlocuim import-ul 'dotenv/config' care cauzează probleme la bundling

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurare CORS pentru Railway
const allowedOrigins = [
  'https://managio.ro',
  'https://app.managio.ro',
  'https://managiosync.up.railway.app',
  // Trebuie să adăugați domeniul Railway sau custom domain al aplicației aici
];

// În development, permitem toate originile
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
} else {
  app.use(cors({
    origin: function(origin: any, callback: any) {
      // Permitem cereri fără origin (de exemplu, din Postman sau curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.railway.app')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true // Permitem trimiterea de cookie-uri cross-domain
  }));
}

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Folosim portul furnizat de Railway sau default 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
  
  // Configurări pentru conexiuni persistente
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
})();