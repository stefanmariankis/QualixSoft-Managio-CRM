import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { Project, InsertActivityLog } from '@shared/schema';

const router = Router();

// Funcție ajutătoare pentru definirea culorilor pentru statusuri
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'planned':
    case 'planificat':
      return '#9CA3AF'; // gray
    case 'active':
    case 'activ':
    case 'în progres':
      return '#3B82F6'; // blue
    case 'completed':
    case 'finalizat':
      return '#10B981'; // green
    case 'blocked':
    case 'blocat':
      return '#EF4444'; // red
    case 'on_hold':
    case 'în așteptare':
      return '#F59E0B'; // amber
    default:
      return '#6B7280'; // gray-500
  }
}

// Obține statistici pentru proiecte după status
// NOTĂ: Rutele specifice trebuie să fie ÎNAINTEA rutelor cu parametri
router.get('/status/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const organizationId = req.user!.organization_id;
    const orgProjects = await storage.getProjectsByOrganization(organizationId);
    
    // Grupează proiectele după status și numără
    const statusCounts: { [key: string]: number } = {};
    orgProjects.forEach(project => {
      if (!statusCounts[project.status]) {
        statusCounts[project.status] = 0;
      }
      statusCounts[project.status]++;
    });
    
    // Transformă în formatul cerut pentru frontend
    const result = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: getStatusColor(name)
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Eroare la obținerea statisticilor pentru proiecte:', error);
    res.status(500).json({ message: 'Eroare la obținerea statisticilor pentru proiecte' });
  }
});

// Obține lista de proiecte
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }

    // Filtrare după client dacă este specificat
    if (req.query.clientId) {
      const clientId = parseInt(req.query.clientId as string);
      if (isNaN(clientId)) {
        return res.status(400).json({ message: 'ID client invalid' });
      }
      
      // Verificăm dacă utilizatorul are rol de CEO sau super_admin pentru a vedea toate proiectele clientului
      if (req.user.role === 'ceo' || req.user.role === 'super_admin') {
        const clientProjects = await storage.getProjectsByClient(clientId);
        return res.json(clientProjects);
      } else {
        // Pentru alte roluri, filtrăm și după proiectele la care utilizatorul are acces
        const userProjects = await storage.getProjectsForUser(userId, req.user!.organization_id);
        const clientProjects = await storage.getProjectsByClient(clientId);
        
        // Returnăm doar proiectele comune între proiectele clientului și cele la care utilizatorul are acces
        const filteredProjects = clientProjects.filter(clientProject => 
          userProjects.some(userProject => userProject.id === clientProject.id)
        );
        
        return res.json(filteredProjects);
      }
    }

    // Obținem proiectele în funcție de rolul utilizatorului
    const userProjects = await storage.getProjectsForUser(userId, req.user!.organization_id);
    res.json(userProjects);
  } catch (error) {
    console.error('Eroare la obținerea proiectelor:', error);
    res.status(500).json({ message: 'Eroare la obținerea proiectelor' });
  }
});

// Obține detaliile unui proiect
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    console.log("API - GET /api/projects/:id - parametru brut:", req.params.id, "tip:", typeof req.params.id);
    
    // Convertim explicit parametrul la număr
    let projectId: number;
    try {
      projectId = Number(req.params.id);
      
      // Verificăm dacă este un număr valid
      if (isNaN(projectId) || projectId <= 0 || !Number.isInteger(projectId)) {
        console.error(`API - ID proiect invalid: ${req.params.id} => ${projectId}`);
        return res.status(400).json({ message: 'ID proiect invalid' });
      }
      
      console.log("API - ID proiect convertit cu succes:", projectId, "tip:", typeof projectId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID proiect: ${req.params.id}`, err);
      return res.status(400).json({ message: 'ID proiect invalid' });
    }
    
    const project = await storage.getProject(projectId);
    console.log("API - Rezultat căutare proiect:", project ? `găsit (id=${project.id})` : "negăsit");
    
    if (!project || project.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Proiect negăsit' });
    }
    
    // Verificare dacă utilizatorul are acces la acest proiect în funcție de rol
    // CEO și super_admin au acces la toate proiectele
    if (req.user.role !== 'ceo' && req.user.role !== 'super_admin') {
      // Pentru alte roluri verificăm dacă proiectul este asociat cu utilizatorul
      const userProjects = await storage.getProjectsForUser(userId, req.user!.organization_id);
      const hasAccess = userProjects.some(p => p.id === projectId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nu aveți acces la acest proiect' });
      }
    }
    
    // Obține task-urile asociate acestui proiect
    const tasks = await storage.getTasksByProject(projectId);
    
    // Obține înregistrările de timp asociate acestui proiect
    const timeLogs = await storage.getTimeLogsByProject(projectId);
    
    // Obține informații despre client
    const client = await storage.getClient(project.client_id);
    if (!client) {
      return res.status(404).json({ message: 'Client negăsit pentru acest proiect' });
    }
    
    res.json({
      project,
      tasks,
      timeLogs,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone
      }
    });
  } catch (error) {
    console.error('Eroare la obținerea detaliilor proiectului:', error);
    res.status(500).json({ message: 'Eroare la obținerea detaliilor proiectului' });
  }
});

// Adaugă un nou proiect
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    // Verifică dacă clientul există și este în organizația utilizatorului
    const clientId = req.body.client_id;
    const client = await storage.getClient(clientId);
    if (!client || client.organization_id !== req.user!.organization_id) {
      return res.status(400).json({ message: 'Client invalid sau neautorizat' });
    }
    
    const newProject = {
      ...req.body,
      organization_id: req.user!.organization_id,
      created_by: userId,
    };
    
    const createdProject = await storage.createProject(newProject);
    
    // Adaugă o înregistrare în jurnalul de activitate
    await storage.createActivityLog({
      user_id: userId,
      organization_id: req.user!.organization_id,
      action: 'create',
      entity_type: 'project',
      entity_id: createdProject.id,
      metadata: { project_name: createdProject.name, client_id: client.id, client_name: client.name }
    });
    
    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Eroare la crearea proiectului:', error);
    res.status(500).json({ message: 'Eroare la crearea proiectului' });
  }
});

// Actualizează un proiect
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'ID proiect invalid' });
    }
    
    const project = await storage.getProject(projectId);
    if (!project || project.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Proiect negăsit' });
    }
    
    // Dacă se schimbă client_id, verifică dacă noul client există și este în organizația utilizatorului
    if (req.body.client_id && req.body.client_id !== project.client_id) {
      const client = await storage.getClient(req.body.client_id);
      if (!client || client.organization_id !== req.user!.organization_id) {
        return res.status(400).json({ message: 'Client invalid sau neautorizat' });
      }
    }
    
    const updatedProject = await storage.updateProject(projectId, req.body);
    
    // Adaugă o înregistrare în jurnalul de activitate
    await storage.createActivityLog({
      user_id: userId,
      organization_id: req.user!.organization_id,
      action: 'update',
      entity_type: 'project',
      entity_id: projectId,
      metadata: { project_name: updatedProject!.name }
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Eroare la actualizarea proiectului:', error);
    res.status(500).json({ message: 'Eroare la actualizarea proiectului' });
  }
});

// Șterge un proiect
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'ID proiect invalid' });
    }
    
    const project = await storage.getProject(projectId);
    if (!project || project.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Proiect negăsit' });
    }
    
    // Verifică dacă proiectul are task-uri asociate
    const tasks = await storage.getTasksByProject(projectId);
    if (tasks.length > 0) {
      return res.status(400).json({ 
        message: 'Nu se poate șterge proiectul deoarece are task-uri asociate',
        tasks_count: tasks.length
      });
    }
    
    const success = await storage.deleteProject(projectId);
    
    if (success) {
      // Adaugă o înregistrare în jurnalul de activitate
      await storage.createActivityLog({
        user_id: userId,
        organization_id: req.user!.organization_id,
        action: 'delete',
        entity_type: 'project',
        entity_id: projectId,
        metadata: { project_name: project.name }
      });
      
      res.status(200).json({ message: 'Proiect șters cu succes' });
    } else {
      res.status(500).json({ message: 'Nu s-a putut șterge proiectul' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea proiectului:', error);
    res.status(500).json({ message: 'Eroare la ștergerea proiectului' });
  }
});

export default router;