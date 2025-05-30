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
    console.log("API - GET /api/tasks - parametri:", req.query);
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }

    // Helper pentru conversia și validarea parametrilor numerici
    const getValidNumberParam = (param: string | undefined, paramName: string): number | null => {
      if (!param) return null;
      
      console.log(`API - Conversie parametru ${paramName}: ${param}, tip: ${typeof param}`);
      
      try {
        const numValue = Number(param);
        if (isNaN(numValue) || numValue <= 0 || !Number.isInteger(numValue)) {
          console.error(`API - Parametru ${paramName} invalid: ${param} => ${numValue}`);
          return null;
        }
        
        console.log(`API - Parametru ${paramName} valid: ${numValue}`);
        return numValue;
      } catch (err) {
        console.error(`API - Eroare la conversie parametru ${paramName}: ${param}`, err);
        return null;
      }
    };
    
    // Filtrare după proiect dacă este specificat
    if (req.query.project_id) {
      const projectId = getValidNumberParam(req.query.project_id as string, 'project_id');
      if (projectId === null) {
        return res.status(400).json({ message: 'ID proiect invalid' });
      }
      
      console.log(`API - Obținere task-uri pentru proiect ID=${projectId}`);
      const projectTasks = await storage.getTasksByProject(projectId);
      console.log(`API - Task-uri găsite pentru proiect ID=${projectId}:`, projectTasks.length);
      return res.json(projectTasks);
    }
    
    // Filtrare după utilizator asignat dacă este specificat
    if (req.query.assigneeId) {
      const assigneeId = getValidNumberParam(req.query.assigneeId as string, 'assigneeId');
      if (assigneeId === null) {
        return res.status(400).json({ message: 'ID utilizator invalid' });
      }
      
      console.log(`API - Obținere task-uri pentru utilizator ID=${assigneeId}`);
      const assigneeTasks = await storage.getTasksByUser(assigneeId);
      return res.json(assigneeTasks);
    }
    
    // Filtrare după status dacă este specificat
    const statuses = req.query.status ? 
      Array.isArray(req.query.status) ? 
        req.query.status as string[] : 
        [req.query.status as string] 
      : null;
      
    if (statuses) {
      console.log(`API - Filtrare task-uri după status:`, statuses);
    }
    
    // Obține task-urile în funcție de rolul utilizatorului
    const organizationId = req.user!.organization_id;
    console.log(`API - Obținere task-uri pentru organizație ID=${organizationId} și utilizator ID=${userId}, rol=${req.user.role}`);
    
    let allTasks;
    // CEO și super_admin văd toate task-urile
    if (req.user.role === 'ceo' || req.user.role === 'super_admin') {
      allTasks = await storage.getTasksByOrganization(organizationId);
    } else {
      // Ceilalți utilizatori văd doar task-urile la care au acces
      allTasks = await storage.getTasksForUser(userId, organizationId);
    }
    
    // Aplicare filtru după status dacă există
    if (statuses && statuses.length > 0) {
      allTasks = allTasks.filter(task => statuses.includes(task.status));
    }
    
    // Sortare dacă este specificată
    const sortBy = req.query.sortBy as string || 'due_date';
    const sortDir = req.query.sortDir as string || 'asc';
    
    console.log(`API - Sortare task-uri după ${sortBy} în direcția ${sortDir}`);
    
    allTasks.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      // Tratament special pentru date
      if (sortBy === 'due_date' || sortBy === 'created_at' || sortBy === 'updated_at') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }
      
      if (sortDir === 'desc') {
        return valA > valB ? -1 : valA < valB ? 1 : 0;
      } else {
        return valA < valB ? -1 : valA > valB ? 1 : 0;
      }
    });
    
    res.json(allTasks);
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
        if (!task.due_date || task.status === 'completed') return false;
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
    
    console.log("API - GET /api/tasks/:id - parametru brut:", req.params.id, "tip:", typeof req.params.id);
    
    // Convertim explicit parametrul la număr
    let taskId: number;
    try {
      taskId = Number(req.params.id);
      
      // Verificăm dacă este un număr valid
      if (isNaN(taskId) || taskId <= 0 || !Number.isInteger(taskId)) {
        console.error(`API - ID task invalid: ${req.params.id} => ${taskId}`);
        return res.status(400).json({ message: 'ID task invalid' });
      }
      
      console.log("API - ID task convertit cu succes:", taskId, "tip:", typeof taskId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID task: ${req.params.id}`, err);
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    console.log("API - Rezultat căutare task:", task ? `găsit (id=${task.id})` : "negăsit");
    console.log("API - Task info:", JSON.stringify(task, null, 2));
    
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    // Obține înregistrările de timp asociate acestui task
    const timeLogs = await storage.getTimeLogsByTask(taskId);
    
    // Obține comentariile asociate acestui task
    const comments = await storage.getCommentsByEntity('task', taskId);
    
    // Array gol pentru atașamente (nu este implementată funcționalitatea încă)
    const attachments = [];
    
    // Obține informații despre proiect
    const project = await storage.getProject(task.project_id);
    if (!project) {
      return res.status(404).json({ message: 'Proiect negăsit pentru acest task' });
    }
    
    // Verificare dacă utilizatorul are acces la acest task în funcție de rol
    // CEO și super_admin au acces la toate task-urile
    if (req.user.role !== 'ceo' && req.user.role !== 'super_admin') {
      // Pentru alte roluri verificăm dacă task-ul este asignat utilizatorului
      // sau dacă utilizatorul este manager al proiectului asociat
      const isAssignedToUser = task.assignee_id === userId;
      const isProjectManager = project.manager_id === userId;
      
      if (!isAssignedToUser && !isProjectManager) {
        return res.status(403).json({ message: 'Nu aveți acces la acest task' });
      }
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
    
    // Verifică dacă utilizatorul are acces la acest proiect în funcție de rol
    // CEO și super_admin au acces la toate proiectele
    if (req.user.role !== 'ceo' && req.user.role !== 'super_admin') {
      // Pentru alte roluri verificăm dacă proiectul este asociat cu utilizatorul
      const userProjects = await storage.getProjectsForUser(userId, req.user!.organization_id);
      const hasAccess = userProjects.some(p => p.id === projectId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Nu aveți acces la acest proiect' });
      }
    }
    
    // Verifică regulile de asignare a task-urilor
    if (req.body.assignee_id) {
      // Verifică permisiunile utilizatorului de a asigna task-uri
      const userRole = req.user.role;
      
      // Dacă utilizatorul nu este CEO sau super_admin, verificăm regulile suplimentare
      if (userRole !== 'ceo' && userRole !== 'super_admin') {
        // Verificăm dacă utilizatorul este managerul proiectului
        const isProjectManager = project.manager_id === userId;
        
        // Managerul proiectului poate asigna task-uri doar persoanelor din echipa lui
        if (userRole === 'manager') {
          if (!isProjectManager) {
            return res.status(403).json({ 
              message: 'Doar managerul proiectului poate asigna task-uri în cadrul acestui proiect' 
            });
          }
          
          // Verificăm dacă persoana asignată aparține organizației
          const assignedUser = await storage.getUser(req.body.assignee_id);
          if (!assignedUser || assignedUser.organization_id !== req.user.organization_id) {
            return res.status(404).json({ 
              message: 'Utilizatorul căruia doriți să asignați task-ul nu a fost găsit' 
            });
          }
          
          // Implementare pentru a verifica dacă utilizatorul este în departamentul managerului
          // Această logică ar trebui extinsă în funcție de cerințele specifice și structura bazei de date
          // Deocamdată verificăm doar dacă utilizatorul aparține organizației
          if (assignedUser.organization_id !== req.user.organization_id) {
            return res.status(403).json({ 
              message: 'Nu puteți asigna task-uri unui utilizator care nu face parte din organizație' 
            });
          }
        } else {
          // Angajații obișnuiți pot crea task-uri doar pentru ei înșiși
          if (req.body.assignee_id !== userId) {
            return res.status(403).json({ 
              message: 'Nu aveți permisiunea de a crea task-uri pentru alți utilizatori' 
            });
          }
        }
      }
      // CEO și super_admin pot asigna orice task oricui din organizație
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
    
    console.log("API - PATCH /api/tasks/:id - parametru brut:", req.params.id, "tip:", typeof req.params.id);
    
    // Convertim explicit parametrul la număr
    let taskId: number;
    try {
      taskId = Number(req.params.id);
      
      // Verificăm dacă este un număr valid
      if (isNaN(taskId) || taskId <= 0 || !Number.isInteger(taskId)) {
        console.error(`API - ID task invalid: ${req.params.id} => ${taskId}`);
        return res.status(400).json({ message: 'ID task invalid' });
      }
      
      console.log("API - ID task convertit cu succes:", taskId, "tip:", typeof taskId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID task: ${req.params.id}`, err);
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    console.log("API - Rezultat căutare task pentru actualizare:", task ? `găsit (id=${task.id})` : "negăsit");
    
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    // Verificăm dacă se dorește schimbarea persoanei asignate (assignee_id)
    if (req.body.assignee_id && req.body.assignee_id !== task.assignee_id) {
      // Verifică permisiunile utilizatorului de a asigna task-uri
      const userRole = req.user.role;
      
      // Dacă utilizatorul nu este CEO sau super_admin, verificăm regulile suplimentare
      if (userRole !== 'ceo' && userRole !== 'super_admin') {
        // Obținem proiectul asociat task-ului pentru a verifica rolul utilizatorului în cadrul proiectului
        const project = await storage.getProject(task.project_id);
        if (!project) {
          return res.status(404).json({ message: 'Proiectul asociat task-ului nu a fost găsit' });
        }
        
        // Verificăm dacă utilizatorul curent este managerul proiectului
        const isProjectManager = project.manager_id === userId;
        
        // Managerul proiectului poate asigna task-uri doar persoanelor din echipa lui
        if (userRole === 'manager') {
          if (!isProjectManager) {
            return res.status(403).json({ message: 'Doar managerul proiectului poate asigna task-uri în cadrul acestui proiect' });
          }
          
          // Verificăm dacă persoana asignată aparține de departamentul managerului sau este în echipa proiectului
          // Obținem utilizatorul căruia se dorește asignarea
          const assignedUser = await storage.getUser(req.body.assignee_id);
          if (!assignedUser || assignedUser.organization_id !== req.user.organization_id) {
            return res.status(404).json({ message: 'Utilizatorul căruia doriți să asignați task-ul nu a fost găsit' });
          }
          
          // Verificăm dacă utilizatorul este parte din proiect
          // Această implementare ar trebui extinsă cu o verificare mai complexă care să verifice membrii echipei proiectului
          // Sau un departament anume dacă este cazul
          // Deocamdată verificăm doar dacă utilizatorul aparține organizației
          if (assignedUser.organization_id !== req.user.organization_id) {
            return res.status(403).json({ message: 'Nu puteți asigna task-uri unui utilizator care nu face parte din organizație' });
          }
        } else {
          // Angajații obișnuiți nu pot asigna task-uri altora
          return res.status(403).json({ message: 'Nu aveți permisiunea de a asigna task-uri altor utilizatori' });
        }
      }
      // CEO și super_admin pot asigna orice task oricui din organizație
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
    
    console.log("API - DELETE /api/tasks/:id - parametru brut:", req.params.id, "tip:", typeof req.params.id);
    
    // Convertim explicit parametrul la număr
    let taskId: number;
    try {
      taskId = Number(req.params.id);
      
      // Verificăm dacă este un număr valid
      if (isNaN(taskId) || taskId <= 0 || !Number.isInteger(taskId)) {
        console.error(`API - ID task invalid: ${req.params.id} => ${taskId}`);
        return res.status(400).json({ message: 'ID task invalid' });
      }
      
      console.log("API - ID task convertit cu succes:", taskId, "tip:", typeof taskId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID task: ${req.params.id}`, err);
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    console.log("API - Rezultat căutare task pentru ștergere:", task ? `găsit (id=${task.id})` : "negăsit");
    
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
// Obține comentariile pentru un task
router.get('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    console.log("API - GET /api/tasks/:id/comments - parametru brut:", req.params.id, "tip:", typeof req.params.id);
    
    // Convertim explicit parametrul la număr
    let taskId: number;
    try {
      taskId = Number(req.params.id);
      
      // Verificăm dacă este un număr valid
      if (isNaN(taskId) || taskId <= 0 || !Number.isInteger(taskId)) {
        console.error(`API - ID task invalid pentru comentarii: ${req.params.id} => ${taskId}`);
        return res.status(400).json({ message: 'ID task invalid' });
      }
      
      console.log("API - ID task convertit cu succes:", taskId, "tip:", typeof taskId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID task pentru comentarii: ${req.params.id}`, err);
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    // Obținem comentariile pentru acest task
    const comments = await storage.getCommentsByEntity('task', taskId);
    console.log(`API - S-au găsit ${comments.length} comentarii pentru task-ul cu ID ${taskId}`);
    
    return res.json(comments);
  } catch (error) {
    console.error("Eroare la obținerea comentariilor pentru task:", error);
    return res.status(500).json({ message: 'Eroare internă server' });
  }
});

router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    console.log("API - POST /api/tasks/:id/comments - parametru brut:", req.params.id, "tip:", typeof req.params.id);
    
    // Convertim explicit parametrul la număr
    let taskId: number;
    try {
      taskId = Number(req.params.id);
      
      // Verificăm dacă este un număr valid
      if (isNaN(taskId) || taskId <= 0 || !Number.isInteger(taskId)) {
        console.error(`API - ID task invalid: ${req.params.id} => ${taskId}`);
        return res.status(400).json({ message: 'ID task invalid' });
      }
      
      console.log("API - ID task convertit cu succes:", taskId, "tip:", typeof taskId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID task: ${req.params.id}`, err);
      return res.status(400).json({ message: 'ID task invalid' });
    }
    
    const task = await storage.getTask(taskId);
    console.log("API - Rezultat căutare task pentru comentariu:", task ? `găsit (id=${task.id})` : "negăsit");
    
    if (!task || task.organization_id !== req.user!.organization_id) {
      return res.status(404).json({ message: 'Task negăsit' });
    }
    
    const { content, parent_id } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Conținutul comentariului este obligatoriu' });
    }
    
    // Asigurăm că tabela de comentarii există
    await storage.checkAndCreateCommentsTable();
    
    // Creăm comentariul folosind metoda din DatabaseStorage
    const comment = await storage.createComment({
      entity_type: 'task',
      entity_id: taskId,
      user_id: userId,
      content: content.trim(),
      parent_id: parent_id || null
    });
    
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
      }
    });
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Eroare la adăugarea comentariului:', error);
    res.status(500).json({ message: 'Eroare la adăugarea comentariului' });
  }
});

// Ștergerea unui comentariu
router.delete('/comments/:commentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Neautorizat' });
    }
    
    console.log("API - DELETE /api/tasks/comments/:commentId - parametru brut:", req.params.commentId, "tip:", typeof req.params.commentId);
    
    // Convertim explicit parametrul la număr
    let commentId: number;
    try {
      commentId = Number(req.params.commentId);
      
      // Verificăm dacă este un număr valid
      if (isNaN(commentId) || commentId <= 0 || !Number.isInteger(commentId)) {
        console.error(`API - ID comentariu invalid: ${req.params.commentId} => ${commentId}`);
        return res.status(400).json({ message: 'ID comentariu invalid' });
      }
      
      console.log("API - ID comentariu convertit cu succes:", commentId, "tip:", typeof commentId);
    } catch (err) {
      console.error(`API - Eroare la conversie ID comentariu: ${req.params.commentId}`, err);
      return res.status(400).json({ message: 'ID comentariu invalid' });
    }
    
    // Obținem comentariul pentru a verifica dacă utilizatorul are dreptul să-l șteargă
    const comment = await storage.getComment(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comentariu negăsit' });
    }
    
    // Verificăm dacă comentariul aparține utilizatorului curent
    if (comment.user_id !== userId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a șterge acest comentariu' });
    }
    
    // Ștergem comentariul
    const deleted = await storage.deleteComment(commentId);
    
    if (!deleted) {
      return res.status(500).json({ message: 'Nu s-a putut șterge comentariul' });
    }
    
    res.status(200).json({ message: 'Comentariu șters cu succes' });
  } catch (error) {
    console.error('Eroare la ștergerea comentariului:', error);
    res.status(500).json({ message: 'Eroare la ștergerea comentariului' });
  }
});

export default router;