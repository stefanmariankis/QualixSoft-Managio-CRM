import express from 'express';
import { db } from '../db';
import { storage } from '../storage';
import type { Request, Response, NextFunction } from 'express';

// Extindem tipul Request pentru a include proprietatea user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const router = express.Router();

// Middleware pentru autentificare
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Neautorizat" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || !user.organization_id) {
      return res.status(401).json({ message: "Neautorizat sau organizație nespecificată" });
    }
    
    // Adăugăm utilizatorul și ID-ul organizației la request pentru a fi folosite mai târziu
    req.user = user;
    
    next();
  } catch (error: any) {
    console.error("Eroare la autorizare:", error);
    return res.status(500).json({
      message: "Eroare internă de server",
      error: error.message || "Eroare necunoscută",
    });
  }
};

// Aplică middleware-ul pentru toate rutele
router.use(requireAuth);

// Raport financiar - Veniturile și cheltuielile pe luni
router.get('/financial', async (req: any, res) => {
  try {
    // Obținem perioada pentru raport din query params
    const { startDate, endDate } = req.query;
    const organizationId = req.user.organization_id;
    
    let dateFilter = '';
    const params: any[] = [organizationId];
    
    if (startDate && endDate) {
      dateFilter = 'AND issue_date BETWEEN $2 AND $3';
      params.push(new Date(startDate), new Date(endDate));
    }
    
    // Obținem date financiare din baza de date folosind clientul postgres
    const result = await db`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', issue_date), 'Mon') as month,
        EXTRACT(MONTH FROM issue_date) as month_num,
        EXTRACT(YEAR FROM issue_date) as year,
        SUM(total_amount) as income,
        -- Estimarea cheltuielilor - în realitate ar trebui să existe o tabelă separată pentru cheltuieli
        SUM(total_amount) * 0.6 as expenses,
        SUM(total_amount) * 0.4 as profit
      FROM invoices
      WHERE organization_id = ${organizationId} 
      ${startDate && endDate ? db`AND issue_date BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` : db``}
      GROUP BY DATE_TRUNC('month', issue_date), EXTRACT(MONTH FROM issue_date), EXTRACT(YEAR FROM issue_date)
      ORDER BY year, month_num
    `;
    
    // Dacă nu avem date, returnăm un array gol
    if (!result || result.length === 0) {
      return res.json([]);
    }
    
    // Formăm răspunsul
    const financialData = result.map((row: any) => ({
      month: row.month,
      income: parseFloat(row.income) || 0,
      expenses: parseFloat(row.expenses) || 0,
      profit: parseFloat(row.profit) || 0
    }));
    
    return res.json(financialData);
  } catch (error: any) {
    console.error("Eroare la obținerea raportului financiar:", error);
    return res.status(500).json({
      message: "Eroare la generarea raportului financiar",
      error: error.message || "Eroare necunoscută",
    });
  }
});

// Raport status proiecte
router.get('/project-status', async (req: any, res) => {
  try {
    const organizationId = req.user.organization_id;
    
    // Obținem numărul de proiecte pentru fiecare status
    const result = await db`
      SELECT 
        status,
        COUNT(*) as value
      FROM projects
      WHERE organization_id = ${organizationId}
      GROUP BY status
      ORDER BY value DESC
    `;
    
    // Definim culorile pentru fiecare status
    const statusColors: {[key: string]: string} = {
      'not_started': '#9CA3AF', // gray
      'in_progress': '#3B82F6', // blue
      'on_hold': '#F59E0B',     // amber
      'completed': '#10B981',   // green
      'cancelled': '#EF4444'    // red
    };
    
    // Formăm răspunsul
    const projectStatusData = result.map((row: any) => {
      // Transformăm status-ul din snake_case în format citibil
      const statusDisplay = row.status
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        name: statusDisplay,
        value: parseInt(row.value),
        color: statusColors[row.status] || '#9CA3AF' // Default gray
      };
    });
    
    return res.json(projectStatusData);
  } catch (error: any) {
    console.error("Eroare la obținerea raportului de status proiecte:", error);
    return res.status(500).json({
      message: "Eroare la generarea raportului de status proiecte",
      error: error.message || "Eroare necunoscută",
    });
  }
});

// Raport venituri pe clienți
router.get('/client-revenue', async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.user.organization_id;
    
    let dateFilter = '';
    const params: any[] = [organizationId];
    
    if (startDate && endDate) {
      dateFilter = 'AND i.issue_date BETWEEN $2 AND $3';
      params.push(new Date(startDate), new Date(endDate));
    }
    
    // Obținem venitul total pentru fiecare client
    const result = await db`
      SELECT 
        c.name,
        SUM(i.total_amount) as value
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.organization_id = ${organizationId}
      ${startDate && endDate ? db`AND i.issue_date BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` : db``}
      GROUP BY c.id, c.name
      ORDER BY value DESC
      LIMIT 6
    `;
    
    // Calculăm suma totală pentru a putea adăuga categoria "Alții"
    const totalRevenue = result.reduce((sum: number, row: any) => sum + parseFloat(row.value), 0);
    
    // Obținem venitul total din toate facturile
    const totalResult = await db`
      SELECT SUM(total_amount) as total
      FROM invoices
      WHERE organization_id = ${organizationId}
      ${startDate && endDate ? db`AND issue_date BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` : db``}
    `;
    const grandTotal = parseFloat(totalResult[0]?.total || '0');
    
    // Verificăm dacă există diferență între totalul din top 6 și totalul general
    const otherValue = grandTotal - totalRevenue;
    
    // Formăm răspunsul
    let clientRevenueData = result.map((row: any) => ({
      name: row.name,
      value: parseFloat(row.value)
    }));
    
    // Adăugăm categoria "Alții" dacă există diferență semnificativă
    if (otherValue > 0.01) {
      clientRevenueData.push({
        name: 'Alții',
        value: parseFloat(otherValue.toFixed(2))
      });
    }
    
    return res.json(clientRevenueData);
  } catch (error: any) {
    console.error("Eroare la obținerea raportului venituri pe clienți:", error);
    return res.status(500).json({
      message: "Eroare la generarea raportului venituri pe clienți",
      error: error.message || "Eroare necunoscută",
    });
  }
});

// Raport înregistrare timp
router.get('/time-tracking', async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.user.organization_id;
    
    let dateFilter = '';
    const params: any[] = [organizationId];
    
    if (startDate && endDate) {
      dateFilter = 'AND date BETWEEN $2 AND $3';
      params.push(new Date(startDate), new Date(endDate));
    }
    
    // Obținem datele de înregistrare timp
    const result = await db`
      SELECT 
        TO_CHAR(date, 'Dy') as name,
        EXTRACT(DOW FROM date) as day_of_week,
        SUM(CASE WHEN is_billable THEN hours ELSE 0 END) as billable,
        SUM(CASE WHEN NOT is_billable THEN hours ELSE 0 END) as non_billable
      FROM time_logs
      WHERE organization_id = ${organizationId}
      ${startDate && endDate ? db`AND date BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}` : db``}
      GROUP BY TO_CHAR(date, 'Dy'), EXTRACT(DOW FROM date)
      ORDER BY day_of_week
    `;
    
    // Formăm răspunsul
    const timeTrackingData = result.map((row: any) => ({
      name: row.name,
      billable: parseFloat(row.billable) || 0,
      nonBillable: parseFloat(row.non_billable) || 0
    }));
    
    return res.json(timeTrackingData);
  } catch (error: any) {
    console.error("Eroare la obținerea raportului de înregistrare timp:", error);
    return res.status(500).json({
      message: "Eroare la generarea raportului de înregistrare timp",
      error: error.message || "Eroare necunoscută",
    });
  }
});

// Raport performanță echipă
router.get('/team-performance', async (req: any, res) => {
  try {
    const organizationId = req.user.organization_id;
    
    // Obținem performanța membrilor echipei
    const result = await db`
      WITH user_tasks AS (
        SELECT 
          u.id as user_id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
        FROM users u
        LEFT JOIN tasks t ON u.id = t.assigned_to
        WHERE u.organization_id = ${organizationId}
        GROUP BY u.id, u.first_name, u.last_name
      )
      SELECT 
        name,
        total_tasks as tasks,
        CASE 
          WHEN total_tasks > 0 THEN (completed_tasks::float / total_tasks::float) * 100
          ELSE 0
        END as completion
      FROM user_tasks
      WHERE total_tasks > 0
      ORDER BY completion DESC, tasks DESC
      LIMIT 10
    `;
    
    // Formăm răspunsul
    const teamPerformanceData = result.map((row: any) => ({
      name: row.name,
      tasks: parseInt(row.tasks),
      completion: parseInt(row.completion)
    }));
    
    return res.json(teamPerformanceData);
  } catch (error: any) {
    console.error("Eroare la obținerea raportului de performanță echipă:", error);
    return res.status(500).json({
      message: "Eroare la generarea raportului de performanță echipă",
      error: error.message || "Eroare necunoscută",
    });
  }
});

// Endpoint pentru descărcare raport în diferite formate
router.post('/generate', async (req: any, res) => {
  try {
    const { reportType, format, dateRange } = req.body;
    
    // Aici ar trebui să generăm raportul în formatul solicitat
    // Pentru simplitate, vom returna doar un mesaj de succes
    
    res.json({
      success: true,
      message: `Raport ${reportType} generat în format ${format}`,
      downloadUrl: null // În implementarea reală ar trebui să returnăm un URL pentru descărcare
    });
    
  } catch (error: any) {
    console.error("Eroare la generarea raportului pentru descărcare:", error);
    return res.status(500).json({
      message: "Eroare la generarea raportului pentru descărcare",
      error: error.message || "Eroare necunoscută",
    });
  }
});

export default router;