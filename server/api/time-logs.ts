import express from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { TimeLog, InsertTimeLog } from "@shared/schema";
import { z } from "zod";
import { ApiError, ValidationError } from "../errors";
import { db } from "../db";

const router = express.Router();

// Schema validare pentru crearea unui time log
const createTimeLogSchema = z.object({
  project_id: z.number().int().positive(),
  task_id: z.number().int().positive().optional().nullable(),
  date: z.date().or(z.string().refine(val => !isNaN(Date.parse(val)), { message: "Data trebuie să fie validă" })),
  description: z.string().optional(),
  duration_minutes: z.number().min(0).optional(),
  is_billable: z.boolean().default(true),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
});

// Schema validare pentru actualizarea unui time log
const updateTimeLogSchema = z.object({
  project_id: z.number().int().positive().optional(),
  task_id: z.number().int().positive().optional().nullable(),
  date: z.date().or(z.string().refine(val => !isNaN(Date.parse(val)), { message: "Data trebuie să fie validă" })).optional(),
  description: z.string().optional(),
  duration_minutes: z.number().min(0).optional(),
  is_billable: z.boolean().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
});

// Obține toate înregistrările de timp pentru utilizatorul autentificat
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization_id;
    
    // Parametri de filtrare opționali
    const { project_id, task_id, start_date, end_date } = req.query;

    // Obține înregistrările filtrând după parametrii opționali
    let timeLogs: TimeLog[] = [];
    
    // Dacă utilizatorul are rol de admin, manager sau CEO, poate vedea toate înregistrările
    if (['super_admin', 'ceo', 'manager'].includes(req.user.role)) {
      if (project_id) {
        timeLogs = await storage.getTimeLogsByProject(Number(project_id));
      } else if (task_id) {
        timeLogs = await storage.getTimeLogsByTask(Number(task_id));
      } else {
        // Obține înregistrările pentru organizație folosind SQL direct
        const result = await db`
          SELECT * FROM time_logs
          WHERE organization_id = ${organizationId}
          ORDER BY date DESC, start_time DESC
        `;
        timeLogs = result as unknown as TimeLog[];
      }
    } else {
      // Utilizatorul normal vede doar propriile înregistrări
      timeLogs = await storage.getTimeLogsByUser(userId);
      
      // Aplicăm filtrele dacă există
      if (project_id) {
        timeLogs = timeLogs.filter(log => log.project_id === Number(project_id));
      }
      
      if (task_id) {
        timeLogs = timeLogs.filter(log => log.task_id === Number(task_id));
      }
    }
    
    // Filtrăm după interval de date dacă este specificat
    if (start_date || end_date) {
      const startDateObj = start_date ? new Date(start_date as string) : new Date(0);
      const endDateObj = end_date ? new Date(end_date as string) : new Date();
      
      timeLogs = timeLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDateObj && logDate <= endDateObj;
      });
    }
    
    // Adăugăm informații suplimentare despre proiect și task
    const timeLogsWithDetails = await Promise.all(timeLogs.map(async (log) => {
      const project = log.project_id ? await storage.getProject(log.project_id) : null;
      const task = log.task_id ? await storage.getTask(log.task_id) : null;
      const user = await storage.getUser(log.user_id);
      
      return {
        ...log,
        project_name: project?.name || 'Necunoscut',
        task_title: task?.title || null,
        user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Necunoscut'
      };
    }));
    
    return res.status(200).json(timeLogsWithDetails);
  } catch (error: any) {
    console.error("Eroare la obținerea înregistrărilor de timp:", error);
    return res.status(500).json({
      message: "Eroare la obținerea înregistrărilor de timp",
      error: error.message,
    });
  }
});

// Obține o înregistrare de timp specifică
router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const timeLogId = parseInt(req.params.id);
    if (isNaN(timeLogId)) {
      throw new ApiError("ID înregistrare de timp invalid", 400);
    }
    
    const timeLog = await storage.getTimeLog(timeLogId);
    if (!timeLog) {
      throw new ApiError("Înregistrarea de timp nu a fost găsită", 404);
    }
    
    // Verifică dacă utilizatorul are acces la această înregistrare
    if (
      timeLog.user_id !== req.user.id && 
      !['super_admin', 'ceo', 'manager'].includes(req.user.role) &&
      timeLog.organization_id !== req.user.organization_id
    ) {
      throw new ApiError("Nu aveți permisiunea de a accesa această înregistrare", 403);
    }
    
    // Obține detalii suplimentare
    const project = timeLog.project_id ? await storage.getProject(timeLog.project_id) : null;
    const task = timeLog.task_id ? await storage.getTask(timeLog.task_id) : null;
    const user = await storage.getUser(timeLog.user_id);
    
    const timeLogWithDetails = {
      ...timeLog,
      project_name: project?.name || 'Necunoscut',
      task_title: task?.title || null,
      user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Necunoscut'
    };
    
    return res.status(200).json(timeLogWithDetails);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    
    console.error("Eroare la obținerea înregistrării de timp:", error);
    return res.status(500).json({
      message: "Eroare la obținerea înregistrării de timp",
      error: error.message,
    });
  }
});

// Creează o nouă înregistrare de timp
router.post("/", requireAuth, async (req: any, res) => {
  try {
    // Validăm datele
    const validationResult = createTimeLogSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError("Date invalide", validationResult.error);
    }
    
    const timeLogData = validationResult.data;
    
    // Calculăm durata în minute între start_time și end_time, dacă există
    let durationMinutes = 0;
    if (timeLogData.duration_minutes) {
      durationMinutes = timeLogData.duration_minutes;
    } else if (timeLogData.start_time && timeLogData.end_time) {
      const startTime = new Date(timeLogData.start_time);
      const endTime = new Date(timeLogData.end_time);
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      if (durationMinutes < 0) {
        throw new ValidationError("Ora de sfârșit trebuie să fie după ora de început", {
          end_time: ["Ora de sfârșit trebuie să fie după ora de început"]
        });
      }
    } else if (timeLogData.start_time && !timeLogData.end_time) {
      // Pentru cronometrare în timp real, durata este 0 până când se oprește
      durationMinutes = 0;
    } else {
      throw new ValidationError("Trebuie să specificați fie durata în minute, fie timpul de început și sfârșit", {
        duration_minutes: ["Trebuie să specificați fie durata în minute, fie timpul de început și sfârșit"]
      });
    }
    
    // Asigurăm-ne că avem un câmp date valid
    const date = typeof timeLogData.date === 'string' 
      ? new Date(timeLogData.date) 
      : timeLogData.date;
      
    // Construim un obiect cu datele pentru inserare
    // Nu folosim tipul InsertTimeLog din schema deoarece nu se potrivește cu tabelul
    const insertData: any = {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      project_id: timeLogData.project_id,
      task_id: timeLogData.task_id || null,
      date: date,
      description: timeLogData.description || null,
      is_billable: timeLogData.is_billable,
      duration_minutes: durationMinutes
    };
    
    // Adăugăm start_time și end_time în baza de date
    if (timeLogData.start_time) {
      insertData.start_time = new Date(timeLogData.start_time);
    }
    
    if (timeLogData.end_time) {
      insertData.end_time = new Date(timeLogData.end_time);
    }
    
    // Inserăm în baza de date
    const newTimeLog = await storage.createTimeLog(insertData);
    
    // Registrăm activitatea
    await storage.createActivityLog({
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      entity_type: 'time_log',
      entity_id: newTimeLog.id,
      action: 'create',
      metadata: { time_log_id: newTimeLog.id }
    });
    
    return res.status(201).json(newTimeLog);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: error.message,
        errors: error.errors
      });
    }
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    
    console.error("Eroare la crearea înregistrării de timp:", error);
    return res.status(500).json({
      message: "Eroare la crearea înregistrării de timp",
      error: error.message,
    });
  }
});

// Actualizează o înregistrare de timp existentă
router.patch("/:id", requireAuth, async (req: any, res) => {
  try {
    const timeLogId = parseInt(req.params.id);
    if (isNaN(timeLogId)) {
      throw new ApiError("ID înregistrare de timp invalid", 400);
    }
    
    // Verifică dacă înregistrarea există
    const existingTimeLog = await storage.getTimeLog(timeLogId);
    if (!existingTimeLog) {
      throw new ApiError("Înregistrarea de timp nu a fost găsită", 404);
    }
    
    // Verifică dacă utilizatorul are dreptul să actualizeze această înregistrare
    if (
      existingTimeLog.user_id !== req.user.id && 
      !['super_admin', 'ceo', 'manager'].includes(req.user.role) &&
      existingTimeLog.organization_id !== req.user.organization_id
    ) {
      throw new ApiError("Nu aveți permisiunea de a actualiza această înregistrare", 403);
    }
    
    // Validăm datele
    const validationResult = updateTimeLogSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError("Date invalide", validationResult.error);
    }
    
    const timeLogData = validationResult.data;
    
    // Calculăm durata în minute între start_time și end_time, dacă se actualizează
    let durationMinutes;
    
    if (timeLogData.duration_minutes !== undefined) {
      // Dacă s-a specificat direct durata în minute
      durationMinutes = timeLogData.duration_minutes;
    } else if (timeLogData.start_time && timeLogData.end_time) {
      // Dacă s-au specificat orele de început și sfârșit
      const startTime = new Date(timeLogData.start_time);
      const endTime = new Date(timeLogData.end_time);
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      if (durationMinutes < 0) {
        throw new ValidationError("Ora de sfârșit trebuie să fie după ora de început", {
          end_time: ["Ora de sfârșit trebuie să fie după ora de început"]
        });
      }
    } else if (timeLogData.end_time && existingTimeLog.start_time) {
      // Dacă se actualizează doar ora de sfârșit (cum ar fi la oprirea cronometrului)
      const startTime = new Date(existingTimeLog.start_time);
      const endTime = new Date(timeLogData.end_time);
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      if (durationMinutes < 0) {
        throw new ValidationError("Ora de sfârșit trebuie să fie după ora de început", {
          end_time: ["Ora de sfârșit trebuie să fie după ora de început"]
        });
      }
      
      // Calculăm și durata în minute pentru actualizare
      timeLogData.duration_minutes = durationMinutes;
    }
    
    // Pregătim datele pentru actualizare
    // Folosim any pentru a asigura compatibilitatea cu baza de date
    const updateData: any = { 
      updated_at: new Date() 
    };
    
    // Copiem doar proprietățile care sunt sigur compatibile cu baza de date
    if (timeLogData.project_id !== undefined) updateData.project_id = timeLogData.project_id;
    if (timeLogData.task_id !== undefined) updateData.task_id = timeLogData.task_id;
    if (timeLogData.description !== undefined) updateData.description = timeLogData.description;
    if (timeLogData.is_billable !== undefined) updateData.is_billable = timeLogData.is_billable;
    
    // Convertim date din string în Date dacă este necesar
    if (timeLogData.date) {
      updateData.date = typeof timeLogData.date === 'string' ? new Date(timeLogData.date) : timeLogData.date;
    }
    
    // Adăugăm start_time și end_time
    if (timeLogData.start_time) {
      updateData.start_time = new Date(timeLogData.start_time);
    }
    
    if (timeLogData.end_time) {
      updateData.end_time = new Date(timeLogData.end_time);
    }
    
    // Adăugăm durata în minute dacă s-a calculat
    if (durationMinutes !== undefined) {
      updateData.duration_minutes = durationMinutes;
    }
    
    // Actualizăm înregistrarea
    const updatedTimeLog = await storage.updateTimeLog(timeLogId, updateData);
    
    if (!updatedTimeLog) {
      throw new ApiError("Nu s-a putut actualiza înregistrarea de timp", 500);
    }
    
    // Înregistrăm activitatea
    await storage.createActivityLog({
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      entity_type: 'time_log',
      entity_id: timeLogId,
      action: 'update',
      metadata: { time_log_id: timeLogId }
    });
    
    return res.status(200).json(updatedTimeLog);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: error.message,
        errors: error.errors
      });
    }
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    
    console.error("Eroare la actualizarea înregistrării de timp:", error);
    return res.status(500).json({
      message: "Eroare la actualizarea înregistrării de timp",
      error: error.message,
    });
  }
});

// Șterge o înregistrare de timp
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const timeLogId = parseInt(req.params.id);
    if (isNaN(timeLogId)) {
      throw new ApiError("ID înregistrare de timp invalid", 400);
    }
    
    // Verifică dacă înregistrarea există
    const existingTimeLog = await storage.getTimeLog(timeLogId);
    if (!existingTimeLog) {
      throw new ApiError("Înregistrarea de timp nu a fost găsită", 404);
    }
    
    // Verifică dacă utilizatorul are dreptul să șteargă această înregistrare
    if (
      existingTimeLog.user_id !== req.user.id && 
      !['super_admin', 'ceo', 'manager'].includes(req.user.role) &&
      existingTimeLog.organization_id !== req.user.organization_id
    ) {
      throw new ApiError("Nu aveți permisiunea de a șterge această înregistrare", 403);
    }
    
    // Șterge înregistrarea
    const deleted = await storage.deleteTimeLog(timeLogId);
    
    if (!deleted) {
      throw new ApiError("Nu s-a putut șterge înregistrarea de timp", 500);
    }
    
    // Înregistrăm activitatea
    await storage.createActivityLog({
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      entity_type: 'time_log',
      entity_id: timeLogId,
      action: 'delete',
      metadata: { time_log_id: timeLogId }
    });
    
    return res.status(200).json({ message: "Înregistrare de timp ștearsă cu succes" });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    
    console.error("Eroare la ștergerea înregistrării de timp:", error);
    return res.status(500).json({
      message: "Eroare la ștergerea înregistrării de timp",
      error: error.message,
    });
  }
});

// Obține sumarul timpului pentru un proiect
router.get("/project/:id/summary", requireAuth, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      throw new ApiError("ID proiect invalid", 400);
    }
    
    // Verifică dacă proiectul există și utilizatorul are acces la el
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new ApiError("Proiectul nu a fost găsit", 404);
    }
    
    if (
      project.organization_id !== req.user.organization_id &&
      !['super_admin', 'ceo', 'manager'].includes(req.user.role)
    ) {
      throw new ApiError("Nu aveți acces la acest proiect", 403);
    }
    
    // Obține toate înregistrările de timp pentru proiect
    const timeLogs = await storage.getTimeLogsByProject(projectId);
    
    // Calculează statistici
    const totalHours = timeLogs.reduce((sum, log) => sum + ((log.duration_minutes || 0) / 60), 0);
    const billableHours = timeLogs
      .filter(log => log.is_billable)
      .reduce((sum, log) => sum + ((log.duration_minutes || 0) / 60), 0);
    
    // Grupează după utilizator
    const userStats = new Map<number, { user_id: number, user_name: string, hours: number }>();
    
    for (const log of timeLogs) {
      const user = await storage.getUser(log.user_id);
      const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Necunoscut';
      const hours = (log.duration_minutes || 0) / 60;
      
      if (!userStats.has(log.user_id)) {
        userStats.set(log.user_id, { user_id: log.user_id, user_name: userName, hours: 0 });
      }
      
      const userStat = userStats.get(log.user_id)!;
      userStat.hours += hours;
    }
    
    // Grupează după task
    const taskStats = new Map<number, { task_id: number, task_title: string, hours: number }>();
    
    for (const log of timeLogs) {
      if (!log.task_id) continue;
      
      const task = await storage.getTask(log.task_id);
      const taskTitle = task ? task.title : 'Necunoscut';
      const hours = (log.duration_minutes || 0) / 60;
      
      if (!taskStats.has(log.task_id)) {
        taskStats.set(log.task_id, { task_id: log.task_id, task_title: taskTitle, hours: 0 });
      }
      
      const taskStat = taskStats.get(log.task_id)!;
      taskStat.hours += hours;
    }
    
    // Grupează după zi pentru grafic
    const dailyStats: { date: string, hours: number }[] = [];
    const dateMap = new Map<string, number>();
    
    for (const log of timeLogs) {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      const hours = (log.duration_minutes || 0) / 60;
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, 0);
      }
      
      dateMap.set(dateStr, dateMap.get(dateStr)! + hours);
    }
    
    dateMap.forEach((hours, date) => {
      dailyStats.push({ date, hours });
    });
    
    // Sortăm datele pentru grafic după dată
    dailyStats.sort((a, b) => a.date.localeCompare(b.date));
    
    return res.status(200).json({
      total_hours: parseFloat(totalHours.toFixed(2)),
      billable_hours: parseFloat(billableHours.toFixed(2)),
      billable_percentage: totalHours > 0 ? parseFloat((billableHours / totalHours * 100).toFixed(2)) : 0,
      user_stats: Array.from(userStats.values()).map(stat => ({
        ...stat,
        hours: parseFloat(stat.hours.toFixed(2))
      })),
      task_stats: Array.from(taskStats.values()).map(stat => ({
        ...stat,
        hours: parseFloat(stat.hours.toFixed(2))
      })),
      daily_stats: dailyStats.map(stat => ({
        ...stat,
        hours: parseFloat(stat.hours.toFixed(2))
      }))
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    
    console.error("Eroare la obținerea sumarului de timp pentru proiect:", error);
    return res.status(500).json({
      message: "Eroare la obținerea sumarului de timp pentru proiect",
      error: error.message,
    });
  }
});

// Obține statistici de timp pentru rapoarte (pe săptămână / lună)
router.get("/stats", requireAuth, async (req: any, res) => {
  try {
    const { period = 'week', user_id, project_id } = req.query;
    
    // Calculăm intervalul de date
    const today = new Date();
    let startDate: Date;
    
    if (period === 'week') {
      // Ultima săptămână
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      // Ultima lună
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
    } else if (period === 'year') {
      // Ultimul an
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
    } else {
      throw new ApiError("Perioada specificată nu este validă", 400);
    }
    
    // Obținem datele în funcție de filtre
    let timeLogs: TimeLog[] = [];
    
    if (user_id) {
      // Verifică dacă utilizatorul are dreptul să vadă datele acestui utilizator
      if (
        parseInt(user_id as string) !== req.user.id && 
        !['super_admin', 'ceo', 'manager'].includes(req.user.role)
      ) {
        throw new ApiError("Nu aveți permisiunea de a accesa datele acestui utilizator", 403);
      }
      
      timeLogs = await storage.getTimeLogsByUser(parseInt(user_id as string));
    } else if (project_id) {
      // Verifică dacă utilizatorul are acces la proiect
      const project = await storage.getProject(parseInt(project_id as string));
      if (!project) {
        throw new ApiError("Proiectul nu a fost găsit", 404);
      }
      
      if (
        project.organization_id !== req.user.organization_id &&
        !['super_admin', 'ceo', 'manager'].includes(req.user.role)
      ) {
        throw new ApiError("Nu aveți acces la acest proiect", 403);
      }
      
      timeLogs = await storage.getTimeLogsByProject(parseInt(project_id as string));
    } else {
      // Dacă nu s-a specificat niciun filtru, afișăm datele întregi ale organizației
      // dar doar pentru rolurile cu permisiuni
      if (['super_admin', 'ceo', 'manager'].includes(req.user.role)) {
        timeLogs = await storage.getTimeLogsByOrganization(req.user.organization_id);
      } else {
        timeLogs = await storage.getTimeLogsByUser(req.user.id);
      }
    }
    
    // Filtrăm după data de început
    timeLogs = timeLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= today;
    });
    
    // Calculăm statistici
    const totalHours = timeLogs.reduce((sum, log) => sum + ((log.duration_minutes || 0) / 60), 0);
    const billableHours = timeLogs
      .filter(log => log.is_billable)
      .reduce((sum, log) => sum + ((log.duration_minutes || 0) / 60), 0);
    
    // Grupăm datele pentru grafic
    const groupedData: Map<string, { date: string, billable: number, nonBillable: number }> = new Map();
    
    // Pregătim datele pentru fiecare zi în intervalul specificat
    let currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      groupedData.set(dateStr, { date: dateStr, billable: 0, nonBillable: 0 });
      
      // Trecem la următoarea zi
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Populăm datele cu înregistrările efective
    for (const log of timeLogs) {
      const logDate = new Date(log.date);
      const dateStr = logDate.toISOString().split('T')[0];
      
      if (!groupedData.has(dateStr)) continue;
      
      const data = groupedData.get(dateStr)!;
      const hours = (log.duration_minutes || 0) / 60;
      
      if (log.is_billable) {
        data.billable += hours;
      } else {
        data.nonBillable += hours;
      }
    }
    
    // Convertim la array și rotunjim valorile
    const chartData = Array.from(groupedData.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('ro-RO', { weekday: 'short' }),
        billable: parseFloat(item.billable.toFixed(1)),
        nonBillable: parseFloat(item.nonBillable.toFixed(1))
      }));
    
    return res.status(200).json({
      total_hours: parseFloat(totalHours.toFixed(2)),
      billable_hours: parseFloat(billableHours.toFixed(2)),
      billable_percentage: totalHours > 0 ? parseFloat((billableHours / totalHours * 100).toFixed(2)) : 0,
      chart_data: chartData
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    
    console.error("Eroare la obținerea statisticilor de timp:", error);
    return res.status(500).json({
      message: "Eroare la obținerea statisticilor de timp",
      error: error.message,
    });
  }
});

export default router;