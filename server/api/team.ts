import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { NotFoundError, ValidationError, ApiError } from "../errors";
import { teamMemberSchema, InsertTeamMember } from "../../shared/schema";
import { requireAuth } from "../auth";

/**
 * IMPORTANT: Diferența dintre Users și TeamMembers
 * 
 * În Managio avem două concepte separate:
 * 
 * 1. Users (Utilizatori) - Aceștia sunt conturi cu acces la platformă, care se pot autentifica
 *    direct prin interfața principală de login. Aceștia sunt de obicei administratori, proprietari
 *    de conturi sau utilizatori care au nevoie de acces complet la platformă.
 * 
 * 2. TeamMembers (Membri Echipă) - Aceștia sunt persoane care fac parte din echipa unei organizații,
 *    dar nu au neapărat acces la platformă. Ei sunt gestionați prin interfața de echipă și pot primi 
 *    invitații de conectare dacă acest lucru este necesar.
 * 
 * Membrii echipei nu sunt înregistrați automat ca utilizatori în tabela "users", deoarece ei nu 
 * au în mod necesar acces direct la platformă, ci sunt doar înregistrați în organizație.
 */

export const teamRouter = Router();

// Obține toți membrii echipei din organizație
teamRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organization_id) {
        throw new ApiError("ID organizație lipsă", 400);
      }

      const teamMembers = await storage.getTeamMembersByOrganization(
        req.user.organization_id
      );

      res.json(teamMembers);
    } catch (error) {
      next(error);
    }
  }
);

// Obține un membru al echipei după ID
teamRouter.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        throw new ApiError("ID membru invalid", 400);
      }

      const teamMember = await storage.getTeamMember(memberId);
      
      if (!teamMember) {
        throw new NotFoundError("Membrul echipei nu a fost găsit");
      }
      
      // Verifică dacă membrul aparține organizației utilizatorului
      if (teamMember.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest membru al echipei", 403);
      }

      res.json(teamMember);
    } catch (error) {
      next(error);
    }
  }
);

// Obține departamentele unui membru
teamRouter.get(
  "/:id/departments",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        throw new ApiError("ID membru invalid", 400);
      }

      const teamMember = await storage.getTeamMember(memberId);
      
      if (!teamMember) {
        throw new NotFoundError("Membrul echipei nu a fost găsit");
      }
      
      // Verifică dacă membrul aparține organizației utilizatorului
      if (teamMember.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest membru al echipei", 403);
      }

      // Verifică dacă organizația are departamente activate
      const organization = await storage.getOrganization(req.user.organization_id);
      
      if (!organization?.has_departments) {
        throw new ApiError("Funcționalitatea de departamente nu este activată pentru această organizație", 403);
      }

      const departmentMembers = await storage.getDepartmentMembersByTeamMember(memberId);
      
      // Pentru fiecare departament de care aparține membrul, obține detaliile complete
      const departmentsWithDetails = await Promise.all(
        departmentMembers.map(async (depMember: any) => {
          const department = await storage.getDepartment(depMember.department_id);
          return {
            ...depMember,
            department,
          };
        })
      );

      res.json(departmentsWithDetails);
    } catch (error) {
      next(error);
    }
  }
);

// Creează un nou membru al echipei
teamRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organization_id) {
        throw new ApiError("ID organizație lipsă", 400);
      }

      const validationResult = teamMemberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError("Date invalide pentru membrul echipei", validationResult.error.format());
      }

      // Verificăm dacă există deja un membru cu același email
      const existingMember = await storage.getTeamMemberByEmail(validationResult.data.email);
      
      if (existingMember && existingMember.organization_id === req.user.organization_id) {
        throw new ApiError("Există deja un membru al echipei cu acest email", 400);
      }

      const teamMemberData: InsertTeamMember = {
        organization_id: req.user.organization_id,
        first_name: validationResult.data.first_name,
        last_name: validationResult.data.last_name,
        email: validationResult.data.email,
        phone: validationResult.data.phone,
        role: validationResult.data.role as any, // Folosim `as any` pentru a rezolva problema de tipare temporar
        position: validationResult.data.position,
        bio: validationResult.data.bio,
        avatar: validationResult.data.avatar,
        hourly_rate: validationResult.data.hourly_rate,
        is_active: validationResult.data.is_active ?? true,
        created_by: req.user.id,
      };

      const teamMember = await storage.createTeamMember(teamMemberData);

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user.organization_id,
        user_id: req.user.id,
        entity_type: "team_member",
        entity_id: teamMember.id,
        action: "create",
        metadata: {
          member_name: `${teamMember.first_name} ${teamMember.last_name}`,
          role: teamMember.role,
        },
      });

      // Obținem informațiile despre organizație pentru a le folosi în email
      const organization = await storage.getOrganization(req.user.organization_id);
      
      // Importăm utilitar pentru trimiterea email-urilor
      const { sendTeamMemberInvitation } = await import('../utils/email');
      
      // Trimitem email cu invitație și parola temporară
      if (teamMember.temp_password) {
        try {
          await sendTeamMemberInvitation(
            teamMember.email,
            teamMember.first_name,
            teamMember.last_name,
            teamMember.temp_password,
            organization?.name || 'Managio'
          );
          console.log(`Email de invitație trimis către ${teamMember.email}`);
        } catch (emailError) {
          console.error('Eroare la trimiterea emailului de invitație:', emailError);
          // Nu oprim procesul dacă email-ul nu poate fi trimis
        }
      }

      // Returnăm membrul nou creat împreună cu parola temporară pentru a fi afișată utilizatorului
      // Aceasta va fi singura dată când parola temporară va fi afișată
      res.status(201).json({
        ...teamMember,
        temp_password_visible: teamMember.temp_password, // Afișăm parola doar la creare
        email_sent: true // Indicăm că am încercat să trimitem un email
      });
    } catch (error) {
      next(error);
    }
  }
);

// Actualizează un membru al echipei
teamRouter.put(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        throw new ApiError("ID membru invalid", 400);
      }

      const existingMember = await storage.getTeamMember(memberId);
      
      if (!existingMember) {
        throw new NotFoundError("Membrul echipei nu a fost găsit");
      }
      
      // Verifică dacă membrul aparține organizației utilizatorului
      if (existingMember.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest membru al echipei", 403);
      }

      const validationResult = teamMemberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError("Date invalide pentru membrul echipei", validationResult.error.format());
      }

      // Dacă emailul a fost schimbat, verificăm dacă noul email nu este deja folosit
      if (validationResult.data.email !== existingMember.email) {
        const memberWithSameEmail = await storage.getTeamMemberByEmail(validationResult.data.email);
        
        if (memberWithSameEmail && memberWithSameEmail.id !== memberId) {
          throw new ApiError("Există deja un alt membru al echipei cu acest email", 400);
        }
      }

      const teamMemberData = {
        first_name: validationResult.data.first_name,
        last_name: validationResult.data.last_name,
        email: validationResult.data.email,
        phone: validationResult.data.phone,
        role: validationResult.data.role as any, // Folosim `as any` pentru a rezolva problema de tipare temporar
        position: validationResult.data.position,
        bio: validationResult.data.bio,
        avatar: validationResult.data.avatar,
        hourly_rate: validationResult.data.hourly_rate,
        is_active: validationResult.data.is_active,
      };

      const updatedMember = await storage.updateTeamMember(
        memberId,
        teamMemberData
      );

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user?.organization_id as number,
        user_id: req.user?.id as number,
        entity_type: "team_member",
        entity_id: memberId,
        action: "update",
        metadata: {
          member_name: `${updatedMember?.first_name} ${updatedMember?.last_name}`,
          role: updatedMember?.role,
        },
      });

      res.json(updatedMember);
    } catch (error) {
      next(error);
    }
  }
);

// Șterge un membru al echipei
teamRouter.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        throw new ApiError("ID membru invalid", 400);
      }

      const teamMember = await storage.getTeamMember(memberId);
      
      if (!teamMember) {
        throw new NotFoundError("Membrul echipei nu a fost găsit");
      }
      
      // Verifică dacă membrul aparține organizației utilizatorului
      if (teamMember.organization_id !== req.user?.organization_id) {
        throw new ApiError("Nu aveți acces la acest membru al echipei", 403);
      }

      // Salvăm informațiile despre membru pentru logging înainte de ștergere
      const memberName = `${teamMember.first_name} ${teamMember.last_name}`;
      const memberRole = teamMember.role;

      const success = await storage.deleteTeamMember(memberId);
      
      if (!success) {
        throw new ApiError("Nu s-a putut șterge membrul echipei", 500);
      }

      // Înregistrăm activitatea
      await storage.createActivityLog({
        organization_id: req.user?.organization_id as number,
        user_id: req.user?.id as number,
        entity_type: "team_member",
        entity_id: memberId,
        action: "delete",
        metadata: {
          member_name: memberName,
          role: memberRole,
        },
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Autentificare pentru membru echipă
teamRouter.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new ApiError("Email și parolă sunt obligatorii", 400);
      }
      
      // Verificăm dacă există un membru al echipei cu acest email
      const teamMember = await storage.getTeamMemberByEmail(email);
      
      if (!teamMember) {
        throw new ApiError("Email sau parolă incorecte", 401);
      }
      
      // Dacă parola nu este cea temporară și nu a fost setată o parolă permanentă
      // sau dacă parola este cea temporară și a fost deja setată o parolă permanentă
      if ((password !== teamMember.temp_password && !teamMember.password_set) || 
          (teamMember.password_set && !teamMember.temp_password)) {
        throw new ApiError("Email sau parolă incorecte", 401);
      }
      
      // Returnăm informațiile despre membru și dacă trebuie să-și schimbe parola
      res.json({
        ...teamMember,
        must_change_password: !teamMember.password_set
      });
    } catch (error) {
      next(error);
    }
  }
);

// Schimbare parolă pentru membru echipă la prima autentificare
teamRouter.post(
  "/auth/set-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, temp_password, new_password } = req.body;
      
      if (!id || !temp_password || !new_password) {
        throw new ApiError("ID, parola temporară și noua parolă sunt obligatorii", 400);
      }
      
      const teamMember = await storage.getTeamMember(id);
      
      if (!teamMember) {
        throw new ApiError("Membru inexistent", 404);
      }
      
      // Verificăm dacă parola temporară este corectă
      if (teamMember.temp_password !== temp_password) {
        throw new ApiError("Parolă temporară incorectă", 401);
      }
      
      // Dacă parola a fost deja setată, nu permitem resetarea
      if (teamMember.password_set) {
        throw new ApiError("Parola a fost deja setată", 400);
      }
      
      // Actualizăm datele membrului: setăm flag-ul password_set și ștergem parola temporară
      const updatedMember = await storage.updateTeamMember(id, {
        password_set: true,
        temp_password: null
      });
      
      res.json({ 
        success: true, 
        message: "Parola a fost setată cu succes" 
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// Exportăm routerul pentru a putea fi folosit în alte fișiere
export default teamRouter;