import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification, NotificationPreference } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface NotificationsContextProps {
  notifications: Notification[];
  preferences: NotificationPreference | null;
  isLoading: boolean;
  isUpdatingPreferences: boolean;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  deleteAllNotifications: () => void;
  updatePreferences: (data: Partial<NotificationPreference>) => void;
}

const NotificationsContext = createContext<NotificationsContextProps | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Obține lista de notificări
  const { 
    data: notifications = [], 
    isLoading: isLoadingNotifications 
  } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/notifications");
        if (!res.ok) throw new Error("Nu s-au putut încărca notificările");
        return await res.json();
      } catch (error) {
        console.error("Eroare la încărcarea notificărilor:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Obține preferințele de notificări
  const { 
    data: preferences = null, 
    isLoading: isLoadingPreferences 
  } = useQuery({
    queryKey: ["/api/notifications/preferences"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/notifications/preferences");
        if (!res.ok) throw new Error("Nu s-au putut încărca preferințele de notificări");
        return await res.json();
      } catch (error) {
        console.error("Eroare la încărcarea preferințelor:", error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Mutație pentru a marca o notificare ca citită
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`);
      if (!res.ok) throw new Error("Nu s-a putut marca notificarea ca citită");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutație pentru a șterge o notificare
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/notifications/${id}`);
      if (!res.ok) throw new Error("Nu s-a putut șterge notificarea");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificare ștearsă",
        description: "Notificarea a fost ștearsă cu succes",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutație pentru a actualiza preferințele de notificări
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreference>) => {
      const res = await apiRequest("PATCH", "/api/notifications/preferences", data);
      if (!res.ok) throw new Error("Nu s-au putut actualiza preferințele");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
      toast({
        title: "Preferințe actualizate",
        description: "Preferințele de notificări au fost actualizate cu succes",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutație pentru a marca toate notificările ca citite
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/notifications/read-all");
      if (!res.ok) throw new Error("Nu s-au putut marca toate notificările ca citite");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Toate notificările au fost marcate ca citite",
        description: "Notificările au fost actualizate cu succes",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutație pentru a șterge toate notificările
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/notifications/delete-all");
      if (!res.ok) throw new Error("Nu s-au putut șterge toate notificările");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Toate notificările au fost șterse",
        description: "Notificările au fost șterse cu succes",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Oferă contextul pentru notificări
  const contextValue: NotificationsContextProps = {
    notifications,
    preferences,
    isLoading: isLoadingNotifications || isLoadingPreferences,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: number) => deleteNotificationMutation.mutate(id),
    deleteAllNotifications: () => deleteAllNotificationsMutation.mutate(),
    updatePreferences: (data: Partial<NotificationPreference>) => updatePreferencesMutation.mutate(data),
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}