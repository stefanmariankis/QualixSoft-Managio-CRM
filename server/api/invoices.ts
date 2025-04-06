import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { ApiError, NotFoundError, ValidationError } from "../errors";
import { 
  invoiceSchema, 
  invoiceStatusOptions,
  type Invoice, 
  type InsertInvoice 
} from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Funcție pentru validarea datelor și a le converti în format corespunzător
const ensureDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  
  if (dateInput instanceof Date) {
    // Verificăm dacă obiectul Date este valid
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  
  try {
    // Încercăm să convertim string-ul sau alt tip de date în Date
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error(`Eroare la conversia datei ${dateInput}:`, error);
    return null;
  }
};

// Obține toate facturile pentru organizația utilizatorului autentificat
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req;
    if (!user || !user.organization_id) {
      throw new ApiError("Nu există o organizație asociată acestui utilizator", 400);
    }

    const invoices = await storage.getInvoicesByOrganization(user.organization_id);
    
    // Convertim datele în format valid pentru client
    const formattedInvoices = invoices.map(invoice => ({
      ...invoice,
      issue_date: ensureDate(invoice.issue_date),
      due_date: ensureDate(invoice.due_date),
    }));

    res.json(formattedInvoices);
  } catch (error) {
    console.error("Eroare la obținerea facturilor:", error);
    res.status(error instanceof ApiError ? error.statusCode : 500).json({ 
      message: error instanceof Error ? error.message : "Eroare la obținerea facturilor"
    });
  }
});

// Obține detaliile unei facturi specifice
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      throw new ApiError("ID factură invalid", 400);
    }

    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      throw new NotFoundError("Factura nu a fost găsită");
    }

    // Verificăm dacă utilizatorul are acces la această factură
    if (invoice.organization_id !== user.organization_id) {
      throw new ApiError("Nu aveți acces la această factură", 403);
    }

    // Convertim datele în format valid pentru client
    const formattedInvoice = {
      ...invoice,
      issue_date: ensureDate(invoice.issue_date),
      due_date: ensureDate(invoice.due_date),
    };

    res.json(formattedInvoice);
  } catch (error) {
    console.error("Eroare la obținerea detaliilor facturii:", error);
    res.status(error instanceof ApiError ? error.statusCode : 500).json({ 
      message: error instanceof Error ? error.message : "Eroare la obținerea detaliilor facturii"
    });
  }
});

// Schema pentru validarea datelor la crearea/actualizarea unei facturi
const apiInvoiceSchema = invoiceSchema.extend({
  issue_date: z.string().or(z.date()).optional(),
  due_date: z.string().or(z.date()).optional(),
  status: z.enum(invoiceStatusOptions).optional(),
});

// Creează o nouă factură
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req;
    if (!user || !user.organization_id) {
      throw new ApiError("Nu există o organizație asociată acestui utilizator", 400);
    }

    // Validăm datele primite
    const validationResult = apiInvoiceSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError("Datele facturii sunt invalide", validationResult.error);
    }

    // Adăugăm organization_id la datele facturii
    const invoiceData = {
      ...validationResult.data,
      organization_id: user.organization_id,
      created_by: user.id
    };

    // Creăm factura în baza de date
    const newInvoice = await storage.createInvoice(invoiceData);

    // Înregistrăm activitatea
    await storage.createActivityLog({
      organization_id: user.organization_id,
      user_id: user.id,
      entity_type: "invoice",
      entity_id: newInvoice.id,
      action: "create",
      metadata: { invoice_number: newInvoice.invoice_number }
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error("Eroare la crearea facturii:", error);
    res.status(error instanceof ApiError ? error.statusCode : 500).json({ 
      message: error instanceof Error ? error.message : "Eroare la crearea facturii",
      errors: error instanceof ValidationError ? error.errors : undefined
    });
  }
});

// Actualizează o factură existentă
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      throw new ApiError("ID factură invalid", 400);
    }

    // Verificăm dacă factura există
    const existingInvoice = await storage.getInvoice(invoiceId);
    if (!existingInvoice) {
      throw new NotFoundError("Factura nu a fost găsită");
    }

    // Verificăm dacă utilizatorul are acces la această factură
    if (existingInvoice.organization_id !== user.organization_id) {
      throw new ApiError("Nu aveți acces la această factură", 403);
    }

    // Validăm datele primite
    const validationResult = apiInvoiceSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError("Datele facturii sunt invalide", validationResult.error);
    }

    // Actualizăm factura în baza de date
    const updatedInvoice = await storage.updateInvoice(invoiceId, validationResult.data);

    // Înregistrăm activitatea
    await storage.createActivityLog({
      organization_id: user.organization_id,
      user_id: user.id,
      entity_type: "invoice",
      entity_id: invoiceId,
      action: "update",
      metadata: { invoice_number: existingInvoice.invoice_number }
    });

    res.json(updatedInvoice);
  } catch (error) {
    console.error("Eroare la actualizarea facturii:", error);
    res.status(error instanceof ApiError ? error.statusCode : 500).json({ 
      message: error instanceof Error ? error.message : "Eroare la actualizarea facturii",
      errors: error instanceof ValidationError ? error.errors : undefined
    });
  }
});

// Șterge o factură existentă
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const invoiceId = parseInt(req.params.id);
    
    if (isNaN(invoiceId)) {
      throw new ApiError("ID factură invalid", 400);
    }

    // Verificăm dacă factura există
    const existingInvoice = await storage.getInvoice(invoiceId);
    if (!existingInvoice) {
      throw new NotFoundError("Factura nu a fost găsită");
    }

    // Verificăm dacă utilizatorul are acces la această factură
    if (existingInvoice.organization_id !== user.organization_id) {
      throw new ApiError("Nu aveți acces la această factură", 403);
    }

    // Ștergem factura din baza de date
    const success = await storage.deleteInvoice(invoiceId);

    // Înregistrăm activitatea
    await storage.createActivityLog({
      organization_id: user.organization_id,
      user_id: user.id,
      entity_type: "invoice",
      entity_id: invoiceId,
      action: "delete",
      metadata: { invoice_number: existingInvoice.invoice_number }
    });

    res.json({ success });
  } catch (error) {
    console.error("Eroare la ștergerea facturii:", error);
    res.status(error instanceof ApiError ? error.statusCode : 500).json({ 
      message: error instanceof Error ? error.message : "Eroare la ștergerea facturii"
    });
  }
});

// Endpoint pentru rezumatul facturilor (pentru dashboard și rapoarte)
router.get("/summary", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user } = req;
    if (!user || !user.organization_id) {
      throw new ApiError("Nu există o organizație asociată acestui utilizator", 400);
    }

    const invoices = await storage.getInvoicesByOrganization(user.organization_id);
    
    // Structurăm datele pentru a fi afișate într-un grafic
    const currentDate = new Date();
    const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      return {
        name: date.toLocaleDateString('ro-RO', { month: 'short' }),
        month: date.getMonth(),
        year: date.getFullYear()
      };
    }).reverse();

    const summaryData = lastSixMonths.map(month => {
      // Filtrăm facturile pentru luna curentă
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = ensureDate(invoice.issue_date);
        return invoiceDate && 
               invoiceDate.getMonth() === month.month && 
               invoiceDate.getFullYear() === month.year;
      });

      // Calculăm valorile
      const paid = monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total_amount, 0);
      
      const unpaid = monthInvoices
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + inv.total_amount, 0);
      
      const overdue = monthInvoices
        .filter(inv => {
          const dueDate = ensureDate(inv.due_date);
          return dueDate && 
                 dueDate < new Date() && 
                 inv.status !== 'paid' && 
                 inv.status !== 'cancelled';
        })
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      return {
        name: month.name,
        paid,
        unpaid,
        overdue
      };
    });

    res.json(summaryData);
  } catch (error) {
    console.error("Eroare la obținerea rezumatului facturilor:", error);
    res.status(error instanceof ApiError ? error.statusCode : 500).json({ 
      message: error instanceof Error ? error.message : "Eroare la obținerea rezumatului facturilor"
    });
  }
});

export default router;