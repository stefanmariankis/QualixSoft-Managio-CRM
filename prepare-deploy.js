const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurare
const OUTPUT_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(OUTPUT_DIR, 'public');
const FILES_TO_COPY = [
  { src: 'app.js', dest: path.join(OUTPUT_DIR, 'app.js') },
  { src: '.htaccess', dest: path.join(OUTPUT_DIR, '.htaccess') },
  { src: 'Procfile', dest: path.join(OUTPUT_DIR, 'Procfile') },
  { src: 'package.json', dest: path.join(OUTPUT_DIR, 'package.json') },
];

// Arată un mesaj de start
console.log('='.repeat(60));
console.log(' PREGĂTIRE FIȘIERE PENTRU DEPLOYMENT');
console.log('='.repeat(60));

// Creează directorul de output dacă nu există
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Pasul 1: Rulează comanda de build
console.log('\n[1/4] Construiesc aplicația...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ Build finalizat cu succes!');
} catch (error) {
  console.error('✕ Eroare la build:', error.message);
  process.exit(1);
}

// Pasul 2: Copiază fișierele necesare în directorul dist
console.log('\n[2/4] Copiez fișierele de configurare în directorul dist...');
let copyErrors = 0;
FILES_TO_COPY.forEach(file => {
  try {
    if (fs.existsSync(file.src)) {
      fs.copyFileSync(file.src, file.dest);
      console.log(`✓ Copiat: ${file.src} -> ${file.dest}`);
    } else {
      console.error(`✕ Eroare: Fișierul ${file.src} nu există`);
      copyErrors++;
    }
  } catch (error) {
    console.error(`✕ Eroare la copierea ${file.src}:`, error.message);
    copyErrors++;
  }
});

if (copyErrors > 0) {
  console.error(`⚠ Atenție: ${copyErrors} fișiere nu au putut fi copiate`);
} else {
  console.log('✓ Toate fișierele au fost copiate cu succes!');
}

// Pasul 3: Verifică structura directorului dist
console.log('\n[3/4] Verific structura directorului dist...');

// Verifică existența directoarelor importante
const dirsToCheck = ['dist', 'dist/public', 'dist/public/assets'];
const missingDirs = dirsToCheck.filter(dir => !fs.existsSync(dir));

if (missingDirs.length > 0) {
  console.error('✕ Eroare: Următoarele directoare lipsesc:');
  missingDirs.forEach(dir => console.error(`  - ${dir}`));
  console.error('⚠ Procesul de build ar putea fi incomplet!');
} else {
  console.log('✓ Toate directoarele necesare există!');
}

// Verifică fișierele importante
if (fs.existsSync(PUBLIC_DIR)) {
  const index_html = path.join(PUBLIC_DIR, 'index.html');
  
  if (!fs.existsSync(index_html)) {
    console.error('✕ Eroare: Fișierul index.html lipsește din directorul dist/public!');
  } else {
    console.log('✓ Fișierul index.html există!');
  }
  
  // Verifică fișierele CSS
  const assets_dir = path.join(PUBLIC_DIR, 'assets');
  if (fs.existsSync(assets_dir)) {
    const files = fs.readdirSync(assets_dir);
    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    if (cssFiles.length === 0) {
      console.error('✕ Eroare: Nu există fișiere CSS în directorul dist/public/assets!');
    } else {
      console.log(`✓ Am găsit ${cssFiles.length} fișiere CSS în directorul assets:`);
      cssFiles.forEach(file => console.log(`  - ${file}`));
    }
  } else {
    console.error('✕ Eroare: Directorul assets lipsește din dist/public!');
  }
} else {
  console.error('✕ Eroare: Directorul public lipsește din dist!');
}

// Pasul 4: Listează conținutul directorului dist
console.log('\n[4/4] Conținutul directorului dist:');

function listDir(dir, prefix = '') {
  if (!fs.existsSync(dir)) {
    console.error(`Directorul ${dir} nu există!`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      console.log(`${prefix}${file}/`);
      // Limitează adâncimea listării la 3 niveluri pentru a evita output prea lung
      if (prefix.length < 6) {
        listDir(filePath, `${prefix}  `);
      } else {
        console.log(`${prefix}  ...`);
      }
    } else {
      const fileSize = (stats.size / 1024).toFixed(2) + ' KB';
      console.log(`${prefix}${file} (${fileSize})`);
    }
  });
}

listDir(OUTPUT_DIR);

// Instrucțiuni finale
console.log('\n='.repeat(60));
console.log(' INSTRUCȚIUNI DE DEPLOYMENT');
console.log('='.repeat(60));
console.log('\n1. Copiază ÎNTREG conținutul din directorul dist în public_html pe serverul cPanel');
console.log('   * Asigură-te că toate fișierele sunt copiate, inclusiv cele ascunse (cum ar fi .htaccess)');
console.log('   * NU copia doar folderul public! Trebuie să copiezi TOT conținutul din dist/');
console.log('\n2. Asigură-te că ai instalat toate dependențele pe serverul cPanel:');
console.log('   * Rulează: cd ~/public_html && npm install');
console.log('\n3. Configurează aplicația să ruleze ca serviciu:');
console.log('   * Folosește cPanel -> Setup Node.js App');
console.log('   * Selectează directorul public_html');
console.log('   * Comandă de start: NODE_ENV=production node app.js');
console.log('   * Pornește aplicația');
console.log('\n4. Configurează Railway pentru backend:');
console.log('   * Push repository pe GitHub');
console.log('   * Conectează la Railway și selectează repository');
console.log('   * Setează variabilele de mediu (DATABASE_URL, SESSION_SECRET, etc.)');
console.log('   * Asigură-te că ai Procfile configurat corect pentru Railway');
console.log('\n5. Verifică deployment:');
console.log('   * Accesează site-ul tău și verifică dacă totul funcționează corect');
console.log('   * Verifică dacă CSS-ul se încarcă corect');
console.log('   * Verifică dacă API-ul de backend răspunde corect');
console.log('\nSucces cu deployment-ul! 🚀');