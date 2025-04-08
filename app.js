// Fișier special pentru cPanel - servește doar conținutul static
// Încarcă variabilele de mediu din fișierul .env
require('dotenv').config();

// Importă modulele necesare
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Definește directoarele pentru fișierele statice
const DIST_DIR = path.join(__dirname, 'dist');
const CLIENT_DIR = path.join(DIST_DIR, 'client');
const INDEX_PATH = path.join(CLIENT_DIR, 'index.html');

// Verifică dacă directoarele și fișierele există
console.log('Verificare structură fișiere și directoare:');
console.log('DIST_DIR exists:', fs.existsSync(DIST_DIR));
console.log('CLIENT_DIR exists:', fs.existsSync(CLIENT_DIR));
console.log('INDEX_PATH exists:', fs.existsSync(INDEX_PATH));

// Listează conținutul directorului dist pentru depanare
try {
  if (fs.existsSync(DIST_DIR)) {
    console.log('Conținut director dist:');
    fs.readdirSync(DIST_DIR).forEach(file => {
      console.log('- ' + file);
    });

    if (fs.existsSync(CLIENT_DIR)) {
      console.log('Conținut director client:');
      fs.readdirSync(CLIENT_DIR).forEach(file => {
        console.log('- ' + file);
      });
    }
  }
} catch (err) {
  console.error('Eroare la listarea conținutului directoarelor:', err);
}

// Middleware pentru servirea fișierelor statice din dist/client
app.use(express.static(CLIENT_DIR));

// Middleware pentru toate request-urile care nu corespund unui fișier static
// Returnează index.html pentru a funcționa rutarea client-side
app.get('*', (req, res) => {
  console.log(`Serving SPA for route: ${req.path}`);
  
  if (fs.existsSync(INDEX_PATH)) {
    res.sendFile(INDEX_PATH);
  } else {
    res.status(404).send('Fișierul index.html nu a fost găsit. Asigură-te că ai rulat comanda de build.');
  }
});

// Pornim serverul
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server cPanel pornit pe portul ${PORT}`);
});