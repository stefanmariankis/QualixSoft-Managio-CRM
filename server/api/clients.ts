import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { Client, InsertActivityLog } from '@shared/schema';

const router = Router();

// Obține lista de clienți
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }

    const userClients = await storage.getClientsByOrganization(req.user!.organization_id);
    res.json(userClients);
  } catch (error) {
    console.error('Eroare la obținerea clienților:', error);
    res.status(500).json({ message: 'Eroare la obținerea clienților' });
  }
});

// Obține detaliile unui client
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    console.log("API - GET /api/clients/:id - parametru brut:", req.params.id, "tip:", typeof req.params.id);
    
    // Convertim explicit parametrul la număr
    let clientId: number;
    try {
      clientId = Number(req.params.id);
      
      // Verificăm dacă este un număr valid
      if (isNaN(clientId) || clientId <= 0 || !Number.isInteger(clientId)) {
        console.error(`API - ID client invalid: ${req.params.id} => ${clientId}`);
        return res.status(400).json({ message: 'ID client invalid' });
      }
      
      console.log("API - ID client convertit cu succes:", clientId, "tip:", typeof clientId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID client: ${req.params.id}`, err);
      return res.status(400).json({ message: 'ID client invalid' });
    }
    
    const client = await storage.getClient(clientId);
    console.log("API - Rezultat căutare client:", client ? `găsit (id=${client.id})` : "negăsit");
    
    // Verificăm direct valorile implicate în condiția de verificare
    console.log("API - DEBUG - client?.organization_id =", client?.organization_id, "tip:", typeof client?.organization_id);
    console.log("API - DEBUG - req.user!.organization_id =", req.user!.organization_id, "tip:", typeof req.user!.organization_id);
    console.log("API - DEBUG - Sunt egale?", client?.organization_id === req.user!.organization_id);
    
    if (!client) {
      console.log("API - DEBUG - Client este null sau undefined");
      return res.status(404).json({ message: 'Client inexistent' });
    }
    
    if (client.organization_id !== req.user!.organization_id) {
      console.log("API - DEBUG - Client aparține altei organizații");
      return res.status(403).json({ message: 'Nu aveți acces la acest client' });
    }
    
    // Obține proiectele și facturile asociate acestui client
    const projects = await storage.getProjectsByClient(clientId);
    const invoices = await storage.getInvoicesByClient(clientId);
    
    res.json({ client, projects, invoices });
  } catch (error) {
    console.error('Eroare la obținerea detaliilor clientului:', error);
    res.status(500).json({ message: 'Eroare la obținerea detaliilor clientului' });
  }
});

// Adaugă un nou client
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const newClient = {
      ...req.body,
      organization_id: req.user!.organization_id,
      created_by: userId,
    };
    
    const createdClient = await storage.createClient(newClient);
    
    // Adaugă o înregistrare în jurnalul de activitate
    await storage.createActivityLog({
      user_id: userId,
      organization_id: req.user!.organization_id,
      action: 'create',
      entity_type: 'client',
      entity_id: createdClient.id,
      metadata: { client_name: createdClient.name },
      created_at: new Date(),
    });
    
    res.status(201).json(createdClient);
  } catch (error) {
    console.error('Eroare la crearea clientului:', error);
    res.status(500).json({ message: 'Eroare la crearea clientului' });
  }
});

// Actualizează un client
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: 'ID client invalid' });
    }
    
    const client = await storage.getClient(clientId);
    if (!client || client.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Client negăsit' });
    }
    
    const updatedClient = await storage.updateClient(clientId, req.body);
    
    // Adaugă o înregistrare în jurnalul de activitate
    await storage.createActivityLog({
      user_id: userId,
      organization_id: req.user!.organization_id,
      action: 'update',
      entity_type: 'client',
      entity_id: clientId,
      metadata: { client_name: updatedClient!.name },
      created_at: new Date(),
    });
    
    res.json(updatedClient);
  } catch (error) {
    console.error('Eroare la actualizarea clientului:', error);
    res.status(500).json({ message: 'Eroare la actualizarea clientului' });
  }
});

// Șterge un client
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: 'ID client invalid' });
    }
    
    const client = await storage.getClient(clientId);
    if (!client || client.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Client negăsit' });
    }
    
    // Verifică dacă clientul are proiecte asociate
    const projects = await storage.getProjectsByClient(clientId);
    if (projects.length > 0) {
      return res.status(400).json({ 
        message: 'Nu se poate șterge clientul deoarece are proiecte asociate',
        projects_count: projects.length
      });
    }
    
    const success = await storage.deleteClient(clientId);
    
    if (success) {
      // Adaugă o înregistrare în jurnalul de activitate
      await storage.createActivityLog({
        user_id: userId,
        organization_id: req.user!.organization_id,
        action: 'delete',
        entity_type: 'client',
        entity_id: clientId,
        metadata: { client_name: client.name },
        created_at: new Date(),
      });
      
      res.status(200).json({ message: 'Client șters cu succes' });
    } else {
      res.status(500).json({ message: 'Nu s-a putut șterge clientul' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea clientului:', error);
    res.status(500).json({ message: 'Eroare la ștergerea clientului' });
  }
});

export default router;