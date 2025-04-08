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

  // Funcție pentru verificarea validității unui timer
  const isTimerValid = (timerData: any): boolean => {
    return timerData && 
          timerData.isActive === true && 
          timerData.startTime !== null &&
          timerData.projectId !== null &&
          timerData.projectName !== null;
  };
  
  // Generăm un ID unic pentru acest timer/sesiune
  const [timerSessionId] = useState<string>(`timer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  
  // Verifică la încărcare dacă există un timer activ în localStorage
  // și asigură-te că este validat corect
  useEffect(() => {
    // Verificăm dacă există un semnal explicit de oprire a timerului
    const timerStopped = localStorage.getItem('timerExplicitlyStopped');
    if (timerStopped === 'true') {
      // Dacă timerul a fost oprit explicit de utilizator, nu-l mai reîncărcăm
      // chiar dacă mai există date în localStorage
      console.log('Timerul a fost oprit explicit, nu se reîncarcă...');
      localStorage.removeItem('activeTimer');
      localStorage.removeItem('timerExplicitlyStopped');
      return;
    }
    
    const storedTimer = localStorage.getItem('activeTimer');
    if (storedTimer) {
      try {
        const parsedTimer = JSON.parse(storedTimer);
        
        // Verifică validitatea timer-ului folosind noua funcție
        if (!isTimerValid(parsedTimer)) {
          console.log('Timer invalid sau incomplet găsit în localStorage, se șterge...');
          localStorage.removeItem('activeTimer');
          return;
        }
        
        // Actualizează startTime ca obiect Date
        parsedTimer.startTime = new Date(parsedTimer.startTime);
        
        // Verifică dacă startTime este în viitor (posibil timer corupt)
        const now = new Date();
        if (parsedTimer.startTime > now) {
          console.log('Timer corupt: startTime în viitor, se șterge...');
          localStorage.removeItem('activeTimer');
          return;
        }
        
        // Verifică dacă timerul e mai vechi de 12 ore (probabil a rămas blocat)
        const maxTimerDurationMs = 12 * 60 * 60 * 1000; // 12 ore
        if ((now.getTime() - parsedTimer.startTime.getTime()) > maxTimerDurationMs) {
          console.log('Timer foarte vechi (>12 ore), probabil blocat, se șterge...');
          localStorage.removeItem('activeTimer');
          return;
        }
        
        // Verifică dacă există un ID de sesiune și salvează-l
        if (!parsedTimer.sessionId) {
          parsedTimer.sessionId = timerSessionId;
        }
        
        // Timerul pare valid, îl setăm și persistăm noul ID de sesiune
        console.log('Timer valid găsit în localStorage, se încarcă cu ID:', parsedTimer.sessionId);
        
        // Salvăm informația că acest timer a fost încărcat (pentru a evita reîncărcarea accidentală)
        localStorage.setItem('activeTimer', JSON.stringify({
          ...parsedTimer,
          sessionId: parsedTimer.sessionId,
          lastLoaded: new Date().toISOString()
        }));
        
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
  }, [timerSessionId]);

  // Salvează timer-ul în localStorage când se modifică
  // Adăugăm o condiție suplimentară pentru a evita salvarea în localStorage în timpul resetării
  useEffect(() => {
    // Verificăm dacă e un timer activ
    if (timer.isActive) {
      // Salvăm timer-ul cu ID-ul de sesiune pentru a evita conflicte
      localStorage.setItem('activeTimer', JSON.stringify({
        ...timer,
        sessionId: timerSessionId,
        lastUpdated: new Date().toISOString()
      }));
    } 
    // Dacă timer-ul nu e activ, dar nu suntem în procesul de resetare, ștergem din localStorage
    else if (!timer.isActive && timer.elapsedTime === 0) {
      // Asigurăm ștergerea din localStorage când timer-ul e inactiv și elapsedTime e 0
      localStorage.removeItem('activeTimer');
      // Setăm un flag că timerul a fost oprit explicit pentru a preveni reîncărcarea lui
      localStorage.setItem('timerExplicitlyStopped', 'true');
    }
  }, [timer, timerSessionId]);

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
      
      // Salvăm informațiile importante înainte de a le șterge
      const projectId = timer.projectId;
      const taskId = timer.taskId;
      const projectName = timer.projectName;
      const taskName = timer.taskName;
      const startTimeIso = timer.startTime?.toISOString();
      
      // IMPORTANT: Oprim mai întâi cronometrul pentru a evita actualizările
      stopTimerInterval();
      
      // FOARTE IMPORTANT: Setăm timer-ul ca oprit explicit înainte de orice operație async
      localStorage.setItem('timerExplicitlyStopped', 'true');
      
      // Ștergem imediat din localStorage
      localStorage.removeItem('activeTimer');
      
      // Resetăm starea timer-ului ÎNAINTE de operații async
      setTimer({
        isActive: false,
        startTime: null,
        projectId: null,
        taskId: null,
        projectName: null,
        taskName: null,
        elapsedTime: 0
      });
      
      // Trimite cerere către server pentru a înregistra sfârșitul pontajului
      // Folosim variabilele salvate mai sus, nu timer care a fost resetat
      const res = await apiRequest('POST', '/api/time-logs', {
        project_id: projectId,
        task_id: taskId,
        start_time: startTimeIso,
        end_time: now.toISOString(),
        duration_minutes: durationMinutes,
        description: `Timp înregistrat pentru ${taskName || projectName}`,
        is_billable: true,
        date: now.toISOString().split("T")[0]
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Nu s-a putut opri cronometrul');
      }
      
      // Reîmprospătează lista de înregistrări de timp
      try {
        await queryClient.invalidateQueries({ queryKey: ['/api/time-logs'] });
      } catch (refreshError) {
        console.error('Eroare la reîmprospătarea listei de înregistrări:', refreshError);
      }
      
      // Verificăm încă o dată că timer-ul a fost oprit (paranoia mode)
      if (localStorage.getItem('activeTimer')) {
        console.log('Se forțează încă o dată ștergerea timer-ului din localStorage');
        localStorage.removeItem('activeTimer');
      }
      
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
      
      // Chiar și în caz de eroare, ne asigurăm că timer-ul este oprit
      stopTimerInterval();
      localStorage.removeItem('activeTimer');
      localStorage.setItem('timerExplicitlyStopped', 'true');
    }
  };

  // Funcție pentru resetarea timer-ului
  const resetTimer = () => {
    stopTimerInterval();
    
    // Ștergem ÎNTÂI din localStorage, apoi resetăm starea
    localStorage.removeItem('activeTimer');
    
    setTimer({
      isActive: false,
      startTime: null,
      projectId: null,
      taskId: null,
      projectName: null,
      taskName: null,
      elapsedTime: 0
    });
  };

  // Adăugăm un mecanism de siguranță suplimentar care verifică periodic validitatea timerului
  useEffect(() => {
    // Verificare periodică a validității timerului (o dată la 30 secunde)
    const safetyCheckInterval = setInterval(() => {
      if (timer.isActive && timer.startTime) {
        // Verificăm dacă timerul a depășit o limită rezonabilă (ex: 12 ore)
        const now = new Date();
        const hoursElapsed = (now.getTime() - timer.startTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursElapsed > 12) {
          console.log('Timer detectat ca fiind blocat (>12 ore), se oprește automat...');
          stopTimerInterval();
          localStorage.removeItem('activeTimer');
          localStorage.setItem('timerExplicitlyStopped', 'true');
          setTimer({
            isActive: false,
            startTime: null,
            projectId: null,
            taskId: null,
            projectName: null,
            taskName: null,
            elapsedTime: 0
          });
          
          toast({
            title: 'Cronometru oprit automat',
            description: 'Cronometrul a fost activ mai mult de 12 ore și a fost oprit automat pentru siguranță.',
            variant: 'default',
          });
        }
      }
    }, 30000); // Verifică o dată la 30 secunde
    
    return () => clearInterval(safetyCheckInterval);
  }, [timer]);
  
  // Adăugăm un mecanism pentru sincronizarea între tab-uri
  useEffect(() => {
    // Handler pentru sincronizare între tab-uri
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeTimer') {
        // Dacă un alt tab a șters timerul, îl oprim și în tab-ul curent
        if (!e.newValue && timer.isActive) {
          console.log('Timer oprit în alt tab, se sincronizează...');
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
        }
      } else if (e.key === 'timerExplicitlyStopped' && e.newValue === 'true') {
        // Dacă un alt tab a marcat timerul ca oprit explicit, respectăm această decizie
        console.log('Timer marcat ca oprit explicit în alt tab, se sincronizează...');
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
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [timer]);
  
  // Curățare la unmount pentru toate intervalele
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