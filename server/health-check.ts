// Script pentru verificarea stării aplicației
// Va fi folosit de Railway pentru a determina dacă aplicația rulează corect

import http from 'http';

const options = {
  host: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});

request.end();