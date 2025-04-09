# Ghid de Deployment pe Railway pentru Managio

## Structura Deployment

Acest proiect utilizează o strategie de deployment complet pe Railway, integrând atât frontend-ul cât și backend-ul într-o singură aplicație.

## Pași pentru Deployment

### 1. Pregătirea Repository-ului

1. Clonează sau descarcă proiectul (ca ZIP) din Replit
2. Încarcă proiectul pe un repository GitHub nou
3. Asigură-te că ai adăugat fișierele `.gitignore` și `Procfile`

### 2. Configurarea Railway

1. Creează un cont pe [Railway](https://railway.app/)
2. În dashboard, creează un proiect nou
3. Selectează "Deploy from GitHub repo"
4. Conectează contul GitHub și selectează repository-ul Managio
5. Railway va începe automat procesul de build

### 3. Configurarea Variabilelor de Mediu

În proiectul Railway, configurează următoarele variabile de mediu:

```
NODE_ENV=production
DATABASE_URL=postgresql://...  (Railway va seta automat această variabilă dacă adaugi o bază de date)
SESSION_SECRET=string_secret_aleator_lung
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
SMTP_SECURE=true
EMAIL_FROM=noreply@domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=cheie_supabase
VITE_API_URL=https://url-aplicatie-railway.up.railway.app
```

### 4. Adăugarea Bazei de Date

1. În proiectul Railway, apasă pe "New"
2. Selectează "Database" și apoi "Add PostgreSQL"
3. Railway va crea automat baza de date și va adăuga variabila `DATABASE_URL`

### 5. Configurarea Domeniului Personalizat

1. În proiectul Railway, accesează "Settings"
2. Derulează la secțiunea "Domains"
3. Apasă pe "Custom Domain"
4. Introdu domeniul tău (ex: managio.ro sau app.managio.ro)
5. Urmărește instrucțiunile pentru configurarea DNS

## Structura Codului pentru Railway

Codul a fost optimizat pentru Railway prin:

1. Configurarea CORS pentru a accepta domenii multiple
2. Setarea cookie-urilor pentru cross-domain cu `sameSite: 'none'`
3. Configurarea variabilei de mediu `VITE_API_URL` pentru comunicarea frontend-backend
4. Optimizarea căilor statice pentru structura de fișiere Railway

## Troubleshooting

### Probleme Comune și Soluții

1. **Erori de build**:
   - Verifică log-urile de build în Railway
   - Asigură-te că scripturile din package.json sunt corecte

2. **Probleme de autentificare**:
   - Verifică configurarea cookie-urilor și CORS
   - Asigură-te că `SESSION_SECRET` este setat

3. **Fișiere statice nu se încarcă**:
   - Verifică că build-ul frontend a fost generat corect
   - Verifică path-urile în server/vite.ts

4. **Erori de bază de date**:
   - Asigură-te că `DATABASE_URL` este setat corect
   - Verifică că schema bazei de date a fost aplicată cu `npm run db:push`

## Comenzi Utile

- `npm run build` - Construiește aplicația pentru producție
- `npm start` - Pornește aplicația în modul producție
- `npm run db:push` - Actualizează schema bazei de date

## Resurse

- [Documentație Railway](https://docs.railway.app/)
- [Ghid DNS pentru domenii personalizate](https://docs.railway.app/guides/public-networking#custom-domains)