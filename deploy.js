const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

// Efectuează build-ul aplicației
console.log('Lansare proces de build...');
try {
  childProcess.execSync('npm run build', { stdio: 'inherit' });
  console.log('Build finalizat cu succes!');
} catch (error) {
  console.error('Eroare la build:', error);
  process.exit(1);
}

// Lista de fișiere și directoare care trebuie copiate manual
const filesToCopy = [
  { src: '.htaccess', dest: 'dist/.htaccess' },
  { src: 'app.js', dest: 'dist/app.js' },
];

// Copiază fișierele specificate
console.log('Copiez fișierele necesare în directorul dist...');
filesToCopy.forEach(file => {
  try {
    fs.copyFileSync(file.src, file.dest);
    console.log(`✓ Copiat: ${file.src} -> ${file.dest}`);
  } catch (error) {
    console.error(`✕ Eroare la copierea ${file.src}:`, error.message);
  }
});

// Listă recursivă a tuturor fișierelor din directorul dist
console.log('\nConținutul final al directorului dist:');
function listDir(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      console.log(`${prefix}${file}/`);
      listDir(filePath, `${prefix}  `);
    } else {
      const fileSize = (stats.size / 1024).toFixed(2) + ' KB';
      console.log(`${prefix}${file} (${fileSize})`);
    }
  });
}

listDir('dist');

console.log('\nInstrucțiuni de deployment:');
console.log('1. Copiază ÎNTREG conținutul din directorul dist în public_html pe serverul cPanel');
console.log('2. Verifică că TOATE fișierele au fost copiate, inclusiv subdirectoarele și fișierele ascunse');
console.log('3. Configurează Railway pentru a prelua codul backend din repository');
console.log('4. Asigură-te că toate variabilele de mediu sunt configurate corect pe Railway');
console.log('\nImportant: Nu copia doar dist/public! Trebuie să copiezi TOT conținutul dist!');