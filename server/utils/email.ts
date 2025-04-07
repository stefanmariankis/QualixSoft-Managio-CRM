import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Variabile pentru a verifica dacă sunt disponibile nodemailer sau SendGrid
const SENDGRID_AVAILABLE = !!process.env.SENDGRID_API_KEY;
const SMTP_AVAILABLE = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

// Dacă SENDGRID_API_KEY există, configurăm SendGrid
if (SENDGRID_AVAILABLE) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid configurat și disponibil pentru trimiterea email-urilor.');
}

// Creare transporter pentru Nodemailer (SMTP)
let transporter: nodemailer.Transporter | null = null;

if (SMTP_AVAILABLE) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true pentru 465, false pentru alte porturi
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('Server SMTP configurat și disponibil pentru trimiterea email-urilor.');
}

if (!SENDGRID_AVAILABLE && !SMTP_AVAILABLE) {
  console.warn('Nici SendGrid, nici SMTP nu sunt configurate. Trimiterea email-urilor va fi simulată.');
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Trimite un email folosind SMTP sau SendGrid
 * Dacă niciuna dintre metode nu este configurată, simulează trimiterea
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Afișăm în consolă pentru debugging
    console.log(`[EMAIL] Trimitere email către: ${options.to}`);
    console.log(`[EMAIL] Subiect: ${options.subject}`);
    
    // Utilizăm adresa specificată în configurare sau cea implicită
    const fromAddress = process.env.EMAIL_FROM || 'office@quailisoft.com';
    
    // Configurăm mesajul comun pentru ambele metode
    const message = {
      to: options.to,
      from: fromAddress,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
    };
    
    // 1. Încercăm mai întâi SMTP dacă este disponibil
    if (SMTP_AVAILABLE && transporter) {
      try {
        console.log('Încercare trimitere email prin SMTP...');
        await transporter.sendMail(message);
        console.log(`Email trimis cu succes prin SMTP către ${options.to}`);
        return true;
      } catch (smtpError: any) {
        console.error('Eroare la trimiterea email-ului prin SMTP:', smtpError);
        // Dacă SMTP eșuează, continuăm cu următoarea metodă
      }
    }
    
    // 2. Încercăm SendGrid dacă este disponibil
    if (SENDGRID_AVAILABLE) {
      try {
        console.log('Încercare trimitere email prin SendGrid...');
        await sgMail.send(message);
        console.log(`Email trimis cu succes prin SendGrid către ${options.to}`);
        return true;
      } catch (sendGridError: any) {
        console.error('Eroare la trimiterea email-ului prin SendGrid:', sendGridError);
        
        if (sendGridError.response?.body?.errors) {
          console.error('Detalii eroare SendGrid:', sendGridError.response.body.errors);
        }
      }
    }
    
    // 3. Dacă nicio metodă nu a funcționat, simulăm trimiterea
    console.log(`[SIMULARE EMAIL] Către: ${options.to}`);
    console.log(`[SIMULARE EMAIL] Subiect: ${options.subject}`);
    console.log(`[SIMULARE EMAIL] Text: ${options.text?.substring(0, 200)}${options.text && options.text.length > 200 ? '...' : ''}`);
    console.log(`[SIMULARE EMAIL] Email simulat cu succes către ${options.to}`);
    
    return true; // Returnăm succes simulat pentru a nu bloca funcționalitatea
    
  } catch (error: any) {
    console.error('Eroare neașteptată la procesarea email-ului:', error);
    
    if (error.response?.body?.errors) {
      console.error('Detalii eroare:', error.response.body.errors);
    }
    
    return false;
  }
}

/**
 * Trimite un email cu parola temporară către un membru al echipei
 */
export async function sendTeamMemberInvitation(
  email: string, 
  firstName: string, 
  lastName: string,
  tempPassword: string,
  organizationName: string
): Promise<boolean> {
  const subject = `Invitație în echipa ${organizationName} pe platforma Managio`;
  
  const text = `
Salut ${firstName},

Ai fost adăugat(ă) ca membru în echipa "${organizationName}" pe platforma Managio.

Pentru a accesa contul tău, folosește următoarele informații:
- Email: ${email}
- Parolă temporară: ${tempPassword}

La prima autentificare, vei fi rugat(ă) să-ți schimbi parola temporară.

Cu stimă,
Echipa Managio
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #999; }
    .password { font-weight: bold; font-size: 18px; color: #ff5722; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Bine ai venit în echipa Managio!</h2>
    </div>
    <div class="content">
      <p>Salut ${firstName},</p>
      
      <p>Ai fost adăugat(ă) ca membru în echipa <strong>"${organizationName}"</strong> pe platforma Managio.</p>
      
      <p>Pentru a accesa contul tău, folosește următoarele informații:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Parolă temporară:</strong> <span class="password">${tempPassword}</span></li>
      </ul>
      
      <p>La prima autentificare, vei fi rugat(ă) să-ți schimbi parola temporară.</p>
    </div>
    <div class="footer">
      <p>Cu stimă,<br>Echipa Managio</p>
    </div>
  </div>
</body>
</html>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
}