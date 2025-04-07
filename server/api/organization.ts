import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { ApiError } from "../errors";

const router = Router();

// Schema pentru validare la actualizarea informațiilor generale
const updateOrganizationSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.string().max(0)),
  address: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.string().max(0)),
});

// Schema pentru validare la actualizarea structurii organizaționale
const updateStructureSchema = z.object({
  has_departments: z.boolean(),
});

// Obține detaliile organizației curente
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const organization = await storage.getOrganizationById(req.user.organization_id);
    res.json(organization);
  } catch (error) {
    next(error);
  }
});

// Actualizează informațiile generale ale organizației
router.put("/", requireAuth, async (req, res, next) => {
  try {
    // Validare date
    const validatedData = updateOrganizationSchema.parse(req.body);
    
    // Verifică dacă utilizatorul are drepturi de admin
    if (!["super_admin", "ceo", "director"].includes(req.user.role)) {
      throw new ApiError("Nu aveți permisiunea de a modifica setările organizației", 403);
    }
    
    // Actualizare organizație
    const updatedOrganization = await storage.updateOrganization(
      req.user.organization_id,
      validatedData
    );
    
    res.json(updatedOrganization);
  } catch (error) {
    next(error);
  }
});

// Actualizează structura organizațională
router.put("/structure", requireAuth, async (req, res, next) => {
  try {
    // Validare date
    const validatedData = updateStructureSchema.parse(req.body);
    
    // Verifică dacă utilizatorul are drepturi de admin
    if (!["super_admin", "ceo", "director"].includes(req.user.role)) {
      throw new ApiError("Nu aveți permisiunea de a modifica structura organizației", 403);
    }
    
    // Actualizare structură organizațională
    const updatedOrganization = await storage.updateOrganizationStructure(
      req.user.organization_id,
      validatedData
    );
    
    res.json(updatedOrganization);
  } catch (error) {
    next(error);
  }
});

export default router;