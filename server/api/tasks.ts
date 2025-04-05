import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { Task, InsertActivityLog } from '@shared/schema';

const router = Router();

// Obține lista de task-uri
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }

    // Filtrare după proiect dacă este specificat
    if (req.query.projectId) {
      const projectId = parseInt(req.query.projectId as string);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'ID proiect invalid' });
      }
      
      const projectTasks = await storage.getTasksByProject(projectId);
      return res.json(projectTasks);
    }
    
    // Filtrare după utilizator asignat dacă este specificat
    if (req.query.assigneeId) {
      const assigneeId = parseInt(req.query.assigneeId as string);
      if (isNaN(assigneeId)) {
        return res.status(400).json({ message: 'ID utilizator invalid' });
      }
      
      const assigneeTasks = await storage.getTasksByUser(assigneeId);
      return res.json(assigneeTasks);
    }

    const userTasks = await storage.getTasksByOrganization(req.user!.organization_id);
    res.json(userTasks);
  } catch (error) {
    console.error('Eroare la obținerea task-urilor:', error);
    res.status(500).json({ message: 'Eroare la obținerea task-urilor' });
  }
});

// Obține task-urile cu deadline apropiat
router.get('/upcoming', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const organizationId = req.user!.organization_id;
    const allTasks = await storage.getTasksByOrganization(organizationId);
    
    // Filtrăm task-urile cu termen limită în următoarele 7 zile și care nu sunt finalizate
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingTasks = allTasks
      .filter(task => {
        if (!task.due_date || task.status === 'finalizat') return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a, b) => {
        // Sortare după dată scadentă (ascendent)
        const dateA = a.due_date ? new Date(a.due_date) : new Date(9999, 11, 31);
        const dateB = b.due_date ? new Date(b.due_date) : new Date(9999, 11, 31);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5); // Limităm la 5 task-uri
    
    res.json(upcomingTasks);
  } catch (error) {
    console.error('Eroare la obținerea task-urilor cu termen limită:', error);
    res.status(500).json({ message: 'Eroare la obținerea task-urilor cu termen limită' });
  }
});

// Obține detaliile unui task
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    // Obține înregistrările de timp asociate acestui task
    const timeLogs = await storage.getTimeLogsByTask(taskId);
    
    // Obține comentariile asociate acestui task
    // În versiunea actuală funcția nu există, dar ar trebui implementată
    const comments = []; // Într-o implementare reală, apelăm storage.getCommentsByEntity('task', taskId)
    
    // Obține atașamentele asociate acestui task 
    // În versiunea actuală funcția nu există, dar ar trebui implementată
    const attachments = []; // Într-o implementare reală, apelăm storage.getAttachmentsByEntity('task', taskId)
    
    // Obține informații despre proiect
    const project = await storage.getProject(task.project_id);
    if (!project) {
      return res.status(404).json({ message: 'Proiect negăsit pentru acest task' });
    }
    
    // Obține informații despre client
    const client = await storage.getClient(project.client_id);
    if (!client) {
      return res.status(404).json({ message: 'Client negăsit pentru acest proiect' });
    }
    
    res.json({
      task,
      timeLogs,
      comments,
      attachments,
      project: {
        id: project.id,
        name: project.name,
        client_id: client.id,
        client_name: client.name
      }
    });
  } catch (error) {
    console.error('Eroare la obținerea detaliilor task-ului:', error);
    res.status(500).json({ message: 'Eroare la obținerea detaliilor task-ului' });
  }
});

// Adaugă un nou task
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    // Verifică dacă proiectul există și este în organizația utilizatorului
    const projectId = req.body.project_id;
    const project = await storage.getProject(projectId);
    if (!project || project.organization_id !== req.user!.organization_id) {
      return res.status(400).json({ message: 'Proiect invalid sau neautorizat' });
    }
    
    const newTask = {
      ...req.body,
      organization_id: req.user!.organization_id,
      created_by: userId,
    };
    
    const createdTask = await storage.createTask(newTask);
    
    // Adaugă o înregistrare în jurnalul de activitate
    await storage.createActivityLog({
      user_id: userId,
      organization_id: req.user!.organization_id,
      action: 'create',
      entity_type: 'task',
      entity_id: createdTask.id,
      metadata: { 
        task_title: createdTask.title, 
        project_id: project.id, 
        project_name: project.name,
        assignee_id: createdTask.assignee_id 
      },
      created_at: new Date(),
    });
    
    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Eroare la crearea task-ului:', error);
    res.status(500).json({ message: 'Eroare la crearea task-ului' });
  }
});

// Actualizează un task
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    // Dacă se schimbă project_id, verifică dacă noul proiect există și este în organizația utilizatorului
    if (req.body.project_id && req.body.project_id !== task.project_id) {
      const project = await storage.getProject(req.body.project_id);
      if (!project || project.organization_id !== req.user!.organization_id) {
        return res.status(400).json({ message: 'Proiect invalid sau neautorizat' });
      }
    }
    
    const updatedTask = await storage.updateTask(taskId, req.body);
    
    // Adaugă o înregistrare în jurnalul de activitate
    await storage.createActivityLog({
      user_id: userId,
      organization_id: req.user!.organization_id,
      action: 'update',
      entity_type: 'task',
      entity_id: taskId,
      metadata: { 
        task_title: updatedTask!.title,
        updated_fields: Object.keys(req.body).join(', ')
      },
      created_at: new Date(),
    });
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Eroare la actualizarea task-ului:', error);
    res.status(500).json({ message: 'Eroare la actualizarea task-ului' });
  }
});

// Șterge un task
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    const success = await storage.deleteTask(taskId);
    
    if (success) {
      // Adaugă o înregistrare în jurnalul de activitate
      await storage.createActivityLog({
        user_id: userId,
        organization_id: req.user!.organization_id,
        action: 'delete',
        entity_type: 'task',
        entity_id: taskId,
        metadata: { task_title: task.title },
        created_at: new Date(),
      });
      
      res.status(200).json({ message: 'Task șters cu succes' });
    } else {
      res.status(500).json({ message: 'Nu s-a putut șterge task-ul' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea task-ului:', error);
    res.status(500).json({ message: 'Eroare la ștergerea task-ului' });
  }
});

// Adaugă un comentariu la un task
router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Conținutul comentariului este obligatoriu' });
    }
    
    // În versiunea actuală funcția nu există, dar ar trebui implementată
    // const comment = await storage.createComment({
    //   entity_type: 'task',
    //   entity_id: taskId,
    //   user_id: userId,
    //   content: content.trim(),
    //   created_at: new Date()
    // });
    
    const comment = { id: 1, content }; // Mock pentru simulare
    
    // Adaugă o înregistrare în jurnalul de activitate
    await storage.createActivityLog({
      user_id: userId,
      organization_id: req.user!.organization_id,
      action: 'comment',
      entity_type: 'task',
      entity_id: taskId,
      metadata: { 
        task_title: task.title,
        comment_id: comment.id
      },
      created_at: new Date(),
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Eroare la adăugarea comentariului:', error);
    res.status(500).json({ message: 'Eroare la adăugarea comentariului' });
  }
});

export default router;