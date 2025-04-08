// app.js - Punctul de intrare pentru aplicația Node.js pe cPanel
const { spawn } = require('child_process');
const path = require('path');

// Calea către serverul compilat
const appPath = path.join(__dirname, 'dist', 'index.js');

// Pornește aplicația
const app = spawn('node', [appPath], {
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000
  }
});

app.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

app.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

app.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});