import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ActiveTimer {
  isActive: boolean;
  startTime: Date | null;
  projectId: number | null;
  taskId: number | null;
  projectName: string | null;
  taskName: string | null;
  elapsedTime: number; // în secunde
}

interface TimeTrackingContextType {
  timer: ActiveTimer;
  startTimer: (projectId: number, taskId: number | null, projectName: string, taskName: string | null) => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [timer, setTimer] = useState<ActiveTimer>({
    isActive: false,
    startTime: null,
    projectId: null,
    taskId: null,
    projectName: null,
    taskName: null,
    elapsedTime: 0
  });
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Verifică la încărcare dacă există un timer activ în localStorage
  useEffect(() => {
    const storedTimer = localStorage.getItem('activeTimer');
    if (storedTimer) {
      try {
        const parsedTimer = JSON.parse(storedTimer);
        // Actualizează startTime ca obiect Date
        if (parsedTimer.startTime) {
          parsedTimer.startTime = new Date(parsedTimer.startTime);
        }
        setTimer(parsedTimer);
        
        // Dacă timerul este activ, pornește cronometrul
        if (parsedTimer.isActive && parsedTimer.startTime) {
          startTimerInterval();
        }
      } catch (error) {
        console.error('Eroare la parsarea timer-ului din localStorage:', error);
        localStorage.removeItem('activeTimer');
      }
    }
  }, []);

  // Salvează timer-ul în localStorage când se modifică
  useEffect(() => {
    if (timer.isActive || timer.elapsedTime > 0) {
      localStorage.setItem('activeTimer', JSON.stringify(timer));
    } else {
      localStorage.removeItem('activeTimer');
    }
  }, [timer]);

  // Funcție pentru actualizarea timer-ului
  const updateElapsedTime = () => {
    setTimer(prev => {
      if (!prev.isActive || !prev.startTime) return prev;
      
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - prev.startTime.getTime()) / 1000);
      
      return {
        ...prev,
        elapsedTime: elapsed
      };
    });
  };

  // Pornire interval pentru cronometru
  const startTimerInterval = () => {
    if (intervalId) clearInterval(intervalId);
    
    const id = setInterval(updateElapsedTime, 1000);
    setIntervalId(id);
  };

  // Oprire interval
  const stopTimerInterval = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  // Funcție pentru pornirea timer-ului
  const startTimer = async (projectId: number, taskId: number | null, projectName: string, taskName: string | null) => {
    try {
      // Trimite cerere către server pentru a înregistra începutul pontajului
      const res = await apiRequest('POST', '/api/time-logs', {
        project_id: projectId,
        task_id: taskId,
        start_time: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0], // adăugăm data curentă în format YYYY-MM-DD
        is_billable: true
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Nu s-a putut porni cronometrul');
      }
      
      // Actualizează starea timer-ului
      setTimer({
        isActive: true,
        startTime: new Date(),
        projectId,
        taskId,
        projectName,
        taskName,
        elapsedTime: 0
      });
      
      // Pornește cronometrul
      startTimerInterval();
      
      toast({
        title: 'Cronometru pornit',
        description: `Cronometrare pentru ${taskName || projectName}`,
      });
    } catch (error) {
      console.error('Eroare la pornirea cronometrului:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut porni cronometrul',
        variant: 'destructive',
      });
    }
  };

  // Funcție pentru oprirea timer-ului
  const stopTimer = async () => {
    try {
      if (!timer.isActive || !timer.startTime) {
        throw new Error('Nu există un cronometru activ');
      }
      
      // Calculează durata în minute
      const now = new Date();
      const durationMinutes = Math.ceil((now.getTime() - timer.startTime.getTime()) / (1000 * 60));
      
      // Trimite cerere către server pentru a înregistra sfârșitul pontajului
      
      const res = await apiRequest('POST', '/api/time-logs', {
        project_id: timer.projectId,
        task_id: timer.taskId,
        start_time: timer.startTime?.toISOString(), // Adăugăm startTime pentru constrângerea NOT NULL
        end_time: now.toISOString(), // Adăugăm end_time calculat
        duration_minutes: durationMinutes,
        description: `Timp înregistrat pentru ${timer.taskName || timer.projectName}`,
        is_billable: true,
        date: now.toISOString().split("T")[0] // format YYYY-MM-DD
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Nu s-a putut opri cronometrul');
      }
      
      // Reîmprospătează lista de înregistrări de timp după oprirea cronometrului
      // Acest lucru va face ca pagina de time tracking să își actualizeze datele
      try {
        // Declanșăm o reîmprospătare a datelor de pe server prin queryClient
        await queryClient.invalidateQueries({ queryKey: ['/api/time-logs'] });
      } catch (refreshError) {
        console.error('Eroare la reîmprospătarea listei de înregistrări:', refreshError);
      }
      
      // Oprește cronometrul
      stopTimerInterval();
      
      // Resetează starea timer-ului și șterge din localStorage
      setTimer({
        isActive: false,
        startTime: null,
        projectId: null,
        taskId: null,
        projectName: null,
        taskName: null,
        elapsedTime: 0
      });
      
      // Ștergem explicit datele din localStorage pentru a ne asigura că nu se reîncarcă
      localStorage.removeItem('activeTimer');
      
      toast({
        title: 'Cronometru oprit',
        description: `Timp înregistrat: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      });
    } catch (error) {
      console.error('Eroare la oprirea cronometrului:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut opri cronometrul',
        variant: 'destructive',
      });
    }
  };

  // Funcție pentru resetarea timer-ului
  const resetTimer = () => {
    stopTimerInterval();
    setTimer({
      isActive: false,
      startTime: null,
      projectId: null,
      taskId: null,
      projectName: null,
      taskName: null,
      elapsedTime: 0
    });
    localStorage.removeItem('activeTimer');
  };

  // Curățare la unmount
  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  return (
    <TimeTrackingContext.Provider value={{ timer, startTimer, stopTimer, resetTimer }}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
}