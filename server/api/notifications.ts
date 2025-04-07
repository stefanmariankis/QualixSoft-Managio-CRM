import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import { NotificationFormData, notificationSchema } from '@shared/schema';
import { ValidationError, NotFoundError } from '../errors';
import { ZodError } from 'zod';

/**
 * Convertește erorile de la Zod într-un string ușor de citit
 */
function zodErrorsToString(error: ZodError): string {
  return error.errors
    .map((err) => {
      return `${err.path.join('.')}: ${err.message}`;
    })
    .join(', ');
}

const router = Router();

// Obține toate notificările pentru utilizatorul autentificat
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const notifications = await storage.getNotificationsByUser(userId);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Obține toate notificările necitite pentru utilizatorul autentificat
router.get('/unread', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const notifications = await storage.getUnreadNotificationsByUser(userId);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Obține numărul de notificări necitite pentru utilizatorul autentificat
router.get('/unread/count', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const count = await storage.getUnreadNotificationsCount(userId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Marchează o notificare ca citită
router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user!.id;

    // Verifică dacă notificarea aparține utilizatorului
    const notification = await storage.getNotificationById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notificarea nu a fost găsită');
    }
    
    if (notification.recipient_id !== userId) {
      return res.status(403).json({ message: 'Nu aveți acces la această notificare' });
    }

    await storage.markNotificationAsRead(notificationId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Marchează toate notificările ca citite
router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    await storage.markAllNotificationsAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Creează o notificare (endpoint admin / sistem)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    // Verifică dacă utilizatorul are dreptul de a crea notificări
    if (!['super_admin', 'ceo', 'manager'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a crea notificări' });
    }

    const validation = notificationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Datele de notificare nu sunt valide', zodErrorsToString(validation.error));
    }

    const notificationData: NotificationFormData = validation.data;
    
    // Adăugăm organizationId și setăm read_status ca unread
    // Asigurăm-ne că entity_type este întotdeauna specificat
    if (!notificationData.entity_type) {
      notificationData.entity_type = 'system';
    }
    
    const notification = await storage.createNotification({
      ...notificationData,
      organization_id: req.body.organization_id || req.user!.organization_id!,
      sender_id: req.user!.id,
      read_status: 'unread'
    });

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

// Șterge o notificare
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user!.id;

    // Verifică dacă notificarea aparține utilizatorului
    const notification = await storage.getNotificationById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notificarea nu a fost găsită');
    }
    
    if (notification.recipient_id !== userId && !['super_admin', 'ceo', 'manager'].includes(req.user!.role)) {
      return res.status(403).json({ message: 'Nu aveți acces la această notificare' });
    }

    await storage.deleteNotification(notificationId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Obține preferințele de notificări pentru utilizatorul autentificat
router.get('/preferences', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const preferences = await storage.getNotificationPreferences(userId);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

// Actualizează preferințele de notificări pentru utilizatorul autentificat
router.patch('/preferences', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Verifică mai întâi dacă există preferințe pentru acest utilizator
    const existingPreferences = await storage.getNotificationPreferences(userId);
    
    let preferences;
    if (existingPreferences) {
      // Actualizează preferințele existente
      preferences = await storage.updateNotificationPreferences(userId, req.body);
    } else {
      // Crează preferințe noi pentru utilizator
      preferences = await storage.createNotificationPreferences({
        user_id: userId,
        ...req.body
      });
    }
    
    res.json(preferences);
  } catch (error) {
    next(error);
  }
});

export default router;