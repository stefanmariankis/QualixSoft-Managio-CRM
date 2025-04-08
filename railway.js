// Fișier special pentru Railway - asigură că aplicația poate rula corect
// Încarcă variabilele de mediu din fișierul .env
require('dotenv').config();

// Importă modulele necesare
const express = require('express');
const cors = require('cors');
const http = require('http');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const app = express();

// Versiuni constante
const API_VERSION = "1.0.0";
const MANAGIO_VERSION = "1.2.0";

// Configurare conexiune la baza de date
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verifică conexiunea la baza de date
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Eroare la conectarea la baza de date:', err);
  } else {
    console.log('Conectat la baza de date PostgreSQL:', res.rows[0]);
  }
});

// Setări CORS pentru a permite cereri de la domeniul frontend-ului
app.use(cors({
  origin: ['https://managio.ro', 'http://managio.ro', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Pentru a putea citi JSON în request-uri
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurare sesiuni
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-for-session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none', // Important pentru cross-domain
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 zile
  }
}));

// Middleware pentru logare cereri API
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware pentru verificarea autentificării
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    // Obține utilizatorul din baza de date
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Utilizator negăsit' });
    }
    
    // Atașează utilizatorul la obiectul request
    req.user = result.rows[0];
    
    // Exclude parola din obiectul utilizator
    delete req.user.password;
    
    next();
  } catch (error) {
    console.error('Eroare la verificarea autentificării:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
};

// Rută de test
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
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: API_VERSION
  });
});

// ==== AUTENTIFICARE ====

// Rută de autentificare
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email și parola sunt obligatorii' });
    }
    
    console.log(`Încercare de autentificare pentru: ${email}`);
    
    // Obține utilizatorul din baza de date
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email sau parolă incorecte' });
    }
    
    const user = result.rows[0];
    
    // Verifică parola
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email sau parolă incorecte' });
    }
    
    // Setează sesiunea
    req.session.userId = user.id;
    await new Promise((resolve) => req.session.save(resolve));
    
    // Obține informațiile organizației
    const orgResult = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [user.organization_id]
    );
    
    const organization = orgResult.rows.length > 0 ? orgResult.rows[0] : null;
    
    // Exclude parola din răspuns
    delete user.password;
    
    return res.status(200).json({
      user,
      organization
    });
  } catch (error) {
    console.error('Eroare la autentificare:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// Rută pentru verificarea sesiunii
app.get('/api/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    // Obține utilizatorul din baza de date
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Utilizator negăsit' });
    }
    
    const user = result.rows[0];
    
    // Obține informațiile organizației
    const orgResult = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [user.organization_id]
    );
    
    const organization = orgResult.rows.length > 0 ? orgResult.rows[0] : null;
    
    // Exclude parola din răspuns
    delete user.password;
    
    return res.json({
      user,
      organization
    });
  } catch (error) {
    console.error('Eroare la obținerea datelor utilizatorului:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// Rută pentru delogare
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Eroare la distrugerea sesiunii:', err);
      return res.status(500).json({
        message: 'Eroare la deconectare',
        error: err.message
      });
    }
    
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Deconectat cu succes' });
  });
});

// ==== PROIECTE ====

// Obține toate proiectele
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE organization_id = $1 ORDER BY updated_at DESC',
      [req.user.organization_id]
    );
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Eroare la obținerea proiectelor:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// Obține un proiect specific
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'ID proiect invalid' });
    }
    
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND organization_id = $2',
      [projectId, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proiect negăsit' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Eroare la obținerea proiectului:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// ==== CLIENȚI ====

// Obține toți clienții
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE organization_id = $1 ORDER BY name ASC',
      [req.user.organization_id]
    );
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Eroare la obținerea clienților:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// Obține un client specific
app.get('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ message: 'ID client invalid' });
    }
    
    const result = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND organization_id = $2',
      [clientId, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Client negăsit' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Eroare la obținerea clientului:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// ==== TASK-URI ====

// Obține toate task-urile
app.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const projectId = req.query.project_id;
    
    let query = 'SELECT * FROM tasks WHERE organization_id = $1';
    let queryParams = [req.user.organization_id];
    
    if (projectId) {
      query += ' AND project_id = $2';
      queryParams.push(projectId);
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const result = await pool.query(query, queryParams);
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Eroare la obținerea task-urilor:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// Obține un task specific
app.get('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND organization_id = $2',
      [taskId, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Eroare la obținerea task-ului:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// ==== TIME TRACKING ====

// Obține toate înregistrările de timp
app.get('/api/time-logs', requireAuth, async (req, res) => {
  try {
    const taskId = req.query.task_id;
    const projectId = req.query.project_id;
    
    let query = 'SELECT * FROM time_logs WHERE user_id = $1';
    let queryParams = [req.user.id];
    
    if (taskId) {
      query += ' AND task_id = $2';
      queryParams.push(taskId);
    } else if (projectId) {
      query += ' AND project_id = $2';
      queryParams.push(projectId);
    }
    
    query += ' ORDER BY start_time DESC';
    
    const result = await pool.query(query, queryParams);
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Eroare la obținerea înregistrărilor de timp:', error);
    return res.status(500).json({
      message: 'Eroare internă de server',
      error: error.message
    });
  }
});

// Pornim serverul
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Railway pornit pe portul ${PORT}`);
});