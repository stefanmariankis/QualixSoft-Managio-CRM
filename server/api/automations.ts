import { Request, Response } from "express";
import { storage } from "../storage";
import { 
  automationTriggerTypes, 
  automationActionTypes,
  automationExecutionStatuses,
  type InsertAutomation
} from "../../shared/schema";
import { ApiError, ValidationError, NotFoundError } from "../errors";
import { z } from "zod";

export async function getAutomations(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.organization_id) {
      return res.status(401).json({ message: "Utilizator neautentificat sau fără organizație" });
    }

    // Obținem toate automatizările pentru organizația utilizatorului
    const automations = await storage.getAutomationsByOrganization(req.user.organization_id);
    
    // Adăugăm date suplimentare dacă există query param-ul 'include_logs=true'
    if (req.query.include_logs === 'true') {
      const logs = await storage.getAutomationLogsByOrganization(req.user.organization_id, 100);
      // Grupăm logurile după automation_id
      const logsByAutomationId = logs.reduce((acc, log) => {
        if (!acc[log.automation_id]) {
          acc[log.automation_id] = [];
        }
        acc[log.automation_id].push(log);
        return acc;
      }, {} as Record<number, any[]>);
      
      // Adăugăm logurile la fiecare automatizare
      const automationsWithLogs = automations.map(automation => ({
        ...automation,
        logs: logsByAutomationId[automation.id] || []
      }));
      
      return res.status(200).json(automationsWithLogs);
    }
    
    return res.status(200).json(automations);
  } catch (error: any) {
    console.error("Eroare la obținerea automatizărilor:", error);
    return res.status(500).json({
      message: "Eroare la obținerea automatizărilor",
      error: error.message
    });
  }
}

export async function getAutomationById(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.organization_id) {
      return res.status(401).json({ message: "Utilizator neautentificat sau fără organizație" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID automatizare invalid" });
    }
    
    // Obținem automatizarea cu ID-ul dat
    const automation = await storage.getAutomation(id);
    
    if (!automation) {
      return res.status(404).json({ message: "Automatizare negăsită" });
    }
    
    // Verificăm dacă automatizarea aparține organizației utilizatorului
    if (automation.organization_id !== req.user.organization_id) {
      return res.status(403).json({ message: "Nu aveți acces la această automatizare" });
    }
    
    // Adăugăm detalii suplimentare (triggers, actions, logs)
    const triggers = await storage.getAutomationTriggersByAutomationId(id);
    const actions = await storage.getAutomationActionsByAutomationId(id);
    const logs = await storage.getAutomationLogsByAutomationId(id, 20);
    
    return res.status(200).json({
      ...automation,
      triggers,
      actions,
      logs
    });
  } catch (error: any) {
    console.error("Eroare la obținerea automatizării:", error);
    return res.status(500).json({
      message: "Eroare la obținerea automatizării",
      error: error.message
    });
  }
}

// Schema pentru validarea datelor din cerere
const automationSchema = z.object({
  name: z.string().min(3, "Numele trebuie să conțină cel puțin 3 caractere"),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  trigger_types: z.array(z.enum([...automationTriggerTypes as unknown as [string, ...string[]]])),
  action_types: z.array(z.enum([...automationActionTypes as unknown as [string, ...string[]]]))
});

export async function createAutomation(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.organization_id) {
      return res.status(401).json({ message: "Utilizator neautentificat sau fără organizație" });
    }
    
    // Validăm datele de intrare
    const validationResult = automationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Date invalide",
        errors: validationResult.error.format()
      });
    }
    
    // Pregătim datele pentru inserare
    const automationData: InsertAutomation = {
      organization_id: req.user.organization_id,
      name: req.body.name,
      description: req.body.description,
      is_active: req.body.is_active ?? true,
      created_by: req.user.id,
      trigger_types: req.body.trigger_types,
      action_types: req.body.action_types
    };
    
    // Creăm automatizarea
    const newAutomation = await storage.createAutomation(automationData);
    
    // Dacă există și configurările pentru triggers și actions, le adăugăm
    if (req.body.triggers && Array.isArray(req.body.triggers)) {
      for (let i = 0; i < req.body.triggers.length; i++) {
        const trigger = req.body.triggers[i];
        await storage.createAutomationTrigger({
          automation_id: newAutomation.id,
          trigger_type: trigger.trigger_type,
          entity_type: trigger.entity_type,
          conditions: trigger.conditions || {},
          order_index: i
        });
      }
    }
    
    if (req.body.actions && Array.isArray(req.body.actions)) {
      for (let i = 0; i < req.body.actions.length; i++) {
        const action = req.body.actions[i];
        await storage.createAutomationAction({
          automation_id: newAutomation.id,
          action_type: action.action_type,
          action_config: action.action_config || {},
          order_index: i
        });
      }
    }
    
    // Returnăm automatizarea creată
    const createdAutomation = await storage.getAutomation(newAutomation.id);
    const triggers = await storage.getAutomationTriggersByAutomationId(newAutomation.id);
    const actions = await storage.getAutomationActionsByAutomationId(newAutomation.id);
    
    return res.status(201).json({
      ...createdAutomation,
      triggers,
      actions
    });
  } catch (error: any) {
    console.error("Eroare la crearea automatizării:", error);
    return res.status(500).json({
      message: "Eroare la crearea automatizării",
      error: error.message
    });
  }
}

export async function updateAutomation(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.organization_id) {
      return res.status(401).json({ message: "Utilizator neautentificat sau fără organizație" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID automatizare invalid" });
    }
    
    // Verificăm dacă automatizarea există și aparține organizației utilizatorului
    const automation = await storage.getAutomation(id);
    if (!automation) {
      return res.status(404).json({ message: "Automatizare negăsită" });
    }
    
    if (automation.organization_id !== req.user.organization_id) {
      return res.status(403).json({ message: "Nu aveți acces la această automatizare" });
    }
    
    // Validăm datele de actualizare
    const validateableFields = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => 
        ['name', 'description', 'is_active', 'trigger_types', 'action_types'].includes(key)
      )
    );
    
    const validationSchema = automationSchema.partial();
    const validationResult = validationSchema.safeParse(validateableFields);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Date invalide",
        errors: validationResult.error.format()
      });
    }
    
    // Pregătim datele pentru actualizare
    const updateData: Partial<any> = {
      ...validateableFields,
      updated_by: req.user.id,
      updated_at: new Date()
    };
    
    // Actualizăm automatizarea
    const updatedAutomation = await storage.updateAutomation(id, updateData);
    
    // Actualizăm trigger-ele și acțiunile dacă acestea au fost trimise
    if (req.body.triggers && Array.isArray(req.body.triggers)) {
      // Ștergem trigger-ele existente
      const existingTriggers = await storage.getAutomationTriggersByAutomationId(id);
      for (const trigger of existingTriggers) {
        await storage.deleteAutomationTrigger(trigger.id);
      }
      
      // Adăugăm noile trigger-e
      for (let i = 0; i < req.body.triggers.length; i++) {
        const trigger = req.body.triggers[i];
        await storage.createAutomationTrigger({
          automation_id: id,
          trigger_type: trigger.trigger_type,
          entity_type: trigger.entity_type,
          conditions: trigger.conditions || {},
          order_index: i
        });
      }
    }
    
    if (req.body.actions && Array.isArray(req.body.actions)) {
      // Ștergem acțiunile existente
      const existingActions = await storage.getAutomationActionsByAutomationId(id);
      for (const action of existingActions) {
        await storage.deleteAutomationAction(action.id);
      }
      
      // Adăugăm noile acțiuni
      for (let i = 0; i < req.body.actions.length; i++) {
        const action = req.body.actions[i];
        await storage.createAutomationAction({
          automation_id: id,
          action_type: action.action_type,
          action_config: action.action_config || {},
          order_index: i
        });
      }
    }
    
    // Returnăm automatizarea actualizată
    const refreshedAutomation = await storage.getAutomation(id);
    const triggers = await storage.getAutomationTriggersByAutomationId(id);
    const actions = await storage.getAutomationActionsByAutomationId(id);
    
    return res.status(200).json({
      ...refreshedAutomation,
      triggers,
      actions
    });
  } catch (error: any) {
    console.error("Eroare la actualizarea automatizării:", error);
    return res.status(500).json({
      message: "Eroare la actualizarea automatizării",
      error: error.message
    });
  }
}

export async function deleteAutomation(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.organization_id) {
      return res.status(401).json({ message: "Utilizator neautentificat sau fără organizație" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID automatizare invalid" });
    }
    
    // Verificăm dacă automatizarea există și aparține organizației utilizatorului
    const automation = await storage.getAutomation(id);
    if (!automation) {
      return res.status(404).json({ message: "Automatizare negăsită" });
    }
    
    if (automation.organization_id !== req.user.organization_id) {
      return res.status(403).json({ message: "Nu aveți acces la această automatizare" });
    }
    
    // Ștergem automatizarea (operația șterge cascade și trigger-ele și acțiunile)
    const deleted = await storage.deleteAutomation(id);
    
    if (!deleted) {
      return res.status(500).json({ message: "Ștergerea automatizării a eșuat" });
    }
    
    return res.status(200).json({ 
      message: "Automatizare ștearsă cu succes",
      id
    });
  } catch (error: any) {
    console.error("Eroare la ștergerea automatizării:", error);
    return res.status(500).json({
      message: "Eroare la ștergerea automatizării",
      error: error.message
    });
  }
}