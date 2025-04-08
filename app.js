const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Variabile de configurare
const STATIC_DIR = path.join(__dirname);
const PUBLIC_DIR = path.join(__dirname, 'public');
const ASSETS_DIR = path.join(__dirname, 'public', 'assets');
const INDEX_HTML = path.join(__dirname, 'public', 'index.html');

// Verifică dacă fișierele și directoarele necesare există
console.log('Directorul static:', STATIC_DIR, 'există:', fs.existsSync(STATIC_DIR));
console.log('Directorul public:', PUBLIC_DIR, 'există:', fs.existsSync(PUBLIC_DIR));
console.log('Directorul assets:', ASSETS_DIR, 'există:', fs.existsSync(ASSETS_DIR));
console.log('Fișierul index.html:', INDEX_HTML, 'există:', fs.existsSync(INDEX_HTML));

// Listează directorul public pentru debugging
if (fs.existsSync(PUBLIC_DIR)) {
  console.log('\nConținut director public:');
  fs.readdirSync(PUBLIC_DIR).forEach(file => {
    console.log(' - ' + file);
  });
}

// Listează directorul assets pentru debugging
if (fs.existsSync(ASSETS_DIR)) {
  console.log('\nConținut director assets:');
  fs.readdirSync(ASSETS_DIR).forEach(file => {
    console.log(' - ' + file);
  });
}

// Servește fișierele statice din directorul public
app.use(express.static(PUBLIC_DIR));

// Middleware pentru logare
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Setări pentru a evita problemele de cache browser
app.use((req, res, next) => {
  // Dezactivează cache pentru index.html
  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Permite cache pentru resurse statice (care conțin hash-uri)
  else if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

// Verifică dacă resursele CSS și JS există
app.get('/check-resources', (req, res) => {
  const resources = [];
  
  // Verificăm fișierele CSS
  if (fs.existsSync(ASSETS_DIR)) {
    const cssFiles = fs.readdirSync(ASSETS_DIR)
      .filter(file => file.endsWith('.css'))
      .map(file => `/assets/${file}`);
    
    resources.push(...cssFiles.map(file => ({ type: 'css', path: file, exists: true })));
  }
  
  res.json({
    resources,
    publicDir: fs.existsSync(PUBLIC_DIR),
    assetsDir: fs.existsSync(ASSETS_DIR),
    indexHtml: fs.existsSync(INDEX_HTML)
  });
});

// Pentru rutele SPA, trimite întotdeauna index.html
app.get('*', (req, res) => {
  res.sendFile(INDEX_HTML);
});

// Gestionarea erorilor
app.use((err, req, res, next) => {
  console.error('Eroare server:', err);
  res.status(500).send('Eroare internă de server');
});

// Pornește serverul
app.listen(port, () => {
  console.log(`Aplicația frontend rulează pe portul ${port}`);
  console.log(`Acces local: http://localhost:${port}`);
});