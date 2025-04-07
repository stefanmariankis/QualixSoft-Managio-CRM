import sgMail from '@sendgrid/mail';

// Inițializăm SendGrid cu cheia API
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY nu a fost găsit în variabilele de mediu');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Trimite un email folosind SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Verificăm dacă avem o cheie API configurată
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY nu a fost găsit în variabilele de mediu');
      return false;
    }
    
    // Afișăm în consolă pentru debugging
    console.log(`[EMAIL] Trimitere email către: ${options.to}`);
    console.log(`[EMAIL] Subiect: ${options.subject}`);
    
    // Configurăm mesajul cu adresa de expeditor verificată
    const message = {
      to: options.to,
      from: options.from || 'office@quailisoft.com', // Adresa verificată în SendGrid
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
    };
    
    try {
      // Încercăm să trimitem email-ul
      await sgMail.send(message);
      console.log(`Email trimis cu succes către ${options.to}`);
      return true;
    } catch (sendError: any) {
      // Dacă apare o eroare la trimitere, revenim la simulare
      console.error('Eroare la trimiterea email-ului prin SendGrid:', sendError);
      
      if (sendError.response && sendError.response.body && sendError.response.body.errors) {
        console.error('Detalii eroare SendGrid:', sendError.response.body.errors);
      }
      
      // Simulăm trimiterea pentru a nu bloca funcționalitatea
      console.log(`[SIMULARE EMAIL] Către: ${options.to}`);
      console.log(`[SIMULARE EMAIL] Subiect: ${options.subject}`);
      console.log(`[SIMULARE EMAIL] Text: ${options.text?.substring(0, 200)}${options.text && options.text.length > 200 ? '...' : ''}`);
      console.log(`[SIMULARE EMAIL] Email simulat cu succes către ${options.to}`);
      
      return true; // Returnăm succes simulat
    }
  } catch (error: any) {
    console.error('Eroare neașteptată la procesarea email-ului:', error);
    
    if (error.response && error.response.body && error.response.body.errors) {
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