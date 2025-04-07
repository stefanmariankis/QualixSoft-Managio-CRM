import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { NotFoundError, ValidationError, ApiError } from "../errors";
import { departmentSchema, InsertDepartment } from "../../shared/schema";
import { requireAuth } from "../auth";
import { z } from "zod";

export const departmentsRouter = Router();

// Middleware pentru a verifica dacă organizația are departamente activate
async function checkDepartmentsEnabled(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.organization_id) {
      throw new ApiError("Utilizator sau organizație lipsă", 400);
    }

    const organization = await storage.getOrganization(req.user.organization_id);
    
    if (!organization) {
      throw new NotFoundError("Organizația nu a fost găsită");
    }
    
    if (!organization.has_departments) {
      throw new ApiError("Funcționalitatea de departamente nu este activată pentru această organizație", 403);
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

// Obține toate departamentele organizației
departmentsRouter.get(
  "/",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organization_id) {
        throw new ApiError("ID organizație lipsă", 400);
      }

      const departments = await storage.getDepartmentsByOrganization(
        req.user.organization_id
      );

      res.json(departments);
    } catch (error) {
      next(error);
    }
  }
);

// Obține un departament după ID
departmentsRouter.get(
  "/:id",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        throw new ApiError("ID departament invalid", 400);
      }

      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        throw new NotFoundError("Departamentul nu a fost găsit");
      }
      
      // Verifică dacă departamentul aparține organizației utilizatorului
      if (department.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest departament", 403);
      }

      res.json(department);
    } catch (error) {
      next(error);
    }
  }
);

// Obține membrii unui departament
departmentsRouter.get(
  "/:id/members",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        throw new ApiError("ID departament invalid", 400);
      }

      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        throw new NotFoundError("Departamentul nu a fost găsit");
      }
      
      // Verifică dacă departamentul aparține organizației utilizatorului
      if (department.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest departament", 403);
      }

      const departmentMembers = await storage.getDepartmentMembersByDepartment(departmentId);
      
      // Pentru fiecare membru al departamentului, obține detaliile complete despre acesta
      const membersWithDetails = await Promise.all(
        departmentMembers.map(async (depMember: any) => {
          const teamMember = await storage.getTeamMember(depMember.team_member_id);
          return {
            ...depMember,
            member: teamMember,
          };
        })
      );

      res.json(membersWithDetails);
    } catch (error) {
      next(error);
    }
  }
);

// Creează un departament nou
departmentsRouter.post(
  "/",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organization_id) {
        throw new ApiError("ID organizație lipsă", 400);
      }

      const validationResult = departmentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError("Date invalide pentru departament", validationResult.error.format());
      }

      const departmentData: InsertDepartment = {
        organization_id: req.user.organization_id,
        name: validationResult.data.name,
        description: validationResult.data.description,
        manager_id: validationResult.data.manager_id,
        created_by: req.user.id,
      };

      const department = await storage.createDepartment(departmentData);

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user.organization_id,
        user_id: req.user.id,
        entity_type: "department",
        entity_id: department.id,
        action: "create",
        metadata: {
          department_name: department.name,
        },
      });

      res.status(201).json(department);
    } catch (error) {
      next(error);
    }
  }
);

// Actualizează un departament
departmentsRouter.put(
  "/:id",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        throw new ApiError("ID departament invalid", 400);
      }

      const existingDepartment = await storage.getDepartment(departmentId);
      
      if (!existingDepartment) {
        throw new NotFoundError("Departamentul nu a fost găsit");
      }
      
      // Verifică dacă departamentul aparține organizației utilizatorului
      if (existingDepartment.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest departament", 403);
      }

      const validationResult = departmentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError("Date invalide pentru departament", validationResult.error.format());
      }

      const departmentData = {
        name: validationResult.data.name,
        description: validationResult.data.description,
        manager_id: validationResult.data.manager_id,
      };

      const updatedDepartment = await storage.updateDepartment(
        departmentId,
        departmentData
      );

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user?.organization_id as number,
        user_id: req.user?.id as number,
        entity_type: "department",
        entity_id: departmentId,
        action: "update",
        metadata: {
          department_name: updatedDepartment?.name,
        },
      });

      res.json(updatedDepartment);
    } catch (error) {
      next(error);
    }
  }
);

// Șterge un departament
departmentsRouter.delete(
  "/:id",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        throw new ApiError("ID departament invalid", 400);
      }

      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        throw new NotFoundError("Departamentul nu a fost găsit");
      }
      
      // Verifică dacă departamentul aparține organizației utilizatorului
      if (department.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest departament", 403);
      }

      const success = await storage.deleteDepartment(departmentId);
      
      if (!success) {
        throw new ApiError("Nu s-a putut șterge departamentul", 500);
      }

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user?.organization_id as number,
        user_id: req.user?.id as number,
        entity_type: "department",
        entity_id: departmentId,
        action: "delete",
        metadata: {
          department_name: department.name,
        },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Adaugă un membru la un departament
departmentsRouter.post(
  "/:id/members",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.params.id);
      
      if (isNaN(departmentId)) {
        throw new ApiError("ID departament invalid", 400);
      }

      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        throw new NotFoundError("Departamentul nu a fost găsit");
      }
      
      // Verifică dacă departamentul aparține organizației utilizatorului
      if (department.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest departament", 403);
      }

      // Validăm datele primite
      const schema = z.object({
        team_member_id: z.number({
          required_error: "ID-ul membrului este obligatoriu",
          invalid_type_error: "ID-ul membrului trebuie să fie un număr",
        }),
        is_manager: z.boolean().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError("Date invalide", validationResult.error.format());
      }

      const { team_member_id, is_manager } = validationResult.data;

      // Verifică dacă membrul echipei există și aparține organizației
      const teamMember = await storage.getTeamMember(team_member_id);
      
      if (!teamMember) {
        throw new NotFoundError("Membrul echipei nu a fost găsit");
      }
      
      if (teamMember.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest membru al echipei", 403);
      }

      // Verificăm dacă membrul este deja în departament
      const existingMembers = await storage.getDepartmentMembersByDepartment(departmentId);
      const alreadyMember = existingMembers.some((m: any) => m.team_member_id === team_member_id);
      
      if (alreadyMember) {
        throw new ApiError("Membrul este deja în acest departament", 400);
      }

      const departmentMember = await storage.createDepartmentMember({
        department_id: departmentId,
        team_member_id,
        is_manager: is_manager || false,
      });

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user?.organization_id as number,
        user_id: req.user?.id as number,
        entity_type: "department_member",
        entity_id: departmentMember.id,
        action: "add_member",
        metadata: {
          department_name: department.name,
          member_name: `${teamMember.first_name} ${teamMember.last_name}`,
          is_manager: is_manager || false,
        },
      });

      res.status(201).json(departmentMember);
    } catch (error) {
      next(error);
    }
  }
);

// Șterge un membru dintr-un departament
departmentsRouter.delete(
  "/:departmentId/members/:memberId",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const departmentMemberId = parseInt(req.params.memberId);
      
      if (isNaN(departmentId) || isNaN(departmentMemberId)) {
        throw new ApiError("ID-uri invalide", 400);
      }

      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        throw new NotFoundError("Departamentul nu a fost găsit");
      }
      
      // Verifică dacă departamentul aparține organizației utilizatorului
      if (department.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest departament", 403);
      }

      const departmentMember = await storage.getDepartmentMember(departmentMemberId);
      
      if (!departmentMember) {
        throw new NotFoundError("Relația membru-departament nu a fost găsită");
      }
      
      if (departmentMember.department_id !== departmentId) {
        throw new ApiError("Membrul nu face parte din acest departament", 400);
      }

      // Obținem detalii despre membrul echipei pentru logging
      const teamMember = await storage.getTeamMember(departmentMember.team_member_id);

      const success = await storage.deleteDepartmentMember(departmentMemberId);
      
      if (!success) {
        throw new ApiError("Nu s-a putut elimina membrul din departament", 500);
      }

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user?.organization_id as number,
        user_id: req.user?.id as number,
        entity_type: "department_member",
        entity_id: departmentMemberId,
        action: "remove_member",
        metadata: {
          department_name: department.name,
          member_name: teamMember ? `${teamMember.first_name} ${teamMember.last_name}` : "Membru necunoscut",
        },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Actualizează rolul unui membru în departament (manager sau nu)
departmentsRouter.put(
  "/:departmentId/members/:memberId",
  requireAuth,
  checkDepartmentsEnabled,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const departmentMemberId = parseInt(req.params.memberId);
      
      if (isNaN(departmentId) || isNaN(departmentMemberId)) {
        throw new ApiError("ID-uri invalide", 400);
      }

      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        throw new NotFoundError("Departamentul nu a fost găsit");
      }
      
      // Verifică dacă departamentul aparține organizației utilizatorului
      if (department.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest departament", 403);
      }

      const departmentMember = await storage.getDepartmentMember(departmentMemberId);
      
      if (!departmentMember) {
        throw new NotFoundError("Relația membru-departament nu a fost găsită");
      }
      
      if (departmentMember.department_id !== departmentId) {
        throw new ApiError("Membrul nu face parte din acest departament", 400);
      }

      // Validăm datele primite
      const schema = z.object({
        is_manager: z.boolean({
          required_error: "Proprietatea is_manager este obligatorie",
          invalid_type_error: "Proprietatea is_manager trebuie să fie boolean",
        }),
      });

      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError("Date invalide", validationResult.error.format());
      }

      const { is_manager } = validationResult.data;

      const updatedDepartmentMember = await storage.updateDepartmentMember(
        departmentMemberId,
        { is_manager }
      );

      // Obținem detalii despre membrul echipei pentru logging
      const teamMember = await storage.getTeamMember(departmentMember.team_member_id);

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user?.organization_id as number,
        user_id: req.user?.id as number,
        entity_type: "department_member",
        entity_id: departmentMemberId,
        action: is_manager ? "set_as_manager" : "unset_as_manager",
        metadata: {
          department_name: department.name,
          member_name: teamMember ? `${teamMember.first_name} ${teamMember.last_name}` : "Membru necunoscut",
        },
      });

      res.json(updatedDepartmentMember);
    } catch (error) {
      next(error);
    }
  }
);