import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader2 } from "lucide-react";

interface TimeTrackingModalProps {
  open: boolean;
  onClose: () => void;
  isTimer?: boolean;
  taskId?: number;
  projectId?: number;
}

// Schema validare pentru adăugare manuală
const timeLogSchema = z.object({
  project_id: z.number({
    required_error: "Selectați un proiect",
  }),
  task_id: z.number().optional().nullable(),
  date: z.date({
    required_error: "Selectați data",
  }),
  hours: z.number({
    required_error: "Introduceți numărul de ore",
  }).min(0.01, "Numărul de ore trebuie să fie mai mare de 0"),
  description: z.string().optional(),
  is_billable: z.boolean().default(true),
});

const TimeTrackingModal: React.FC<TimeTrackingModalProps> = ({
  open,
  onClose,
  isTimer = false,
  taskId,
  projectId,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(projectId || null);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Obține lista de proiecte
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/projects");
      if (!res.ok) throw new Error("Nu s-au putut încărca proiectele");
      return await res.json();
    },
  });

  // Obține lista de task-uri pentru proiectul selectat
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks", { project_id: selectedProject }],
    queryFn: async () => {
      if (!selectedProject) return [];
      const res = await apiRequest(
        "GET",
        `/api/tasks?project_id=${selectedProject}`
      );
      if (!res.ok) throw new Error("Nu s-au putut încărca task-urile");
      return await res.json();
    },
    enabled: !!selectedProject,
  });

  // Form pentru adăugare manuală
  const form = useForm<z.infer<typeof timeLogSchema>>({
    resolver: zodResolver(timeLogSchema),
    defaultValues: {
      project_id: projectId || 0,
      task_id: taskId || null,
      date: new Date(),
      hours: 0,
      description: "",
      is_billable: true,
    },
  });

  // Actualizam valoarea pentru project_id cand se schimba props
  useEffect(() => {
    if (projectId) {
      form.setValue("project_id", projectId);
      setSelectedProject(projectId);
    }
    if (taskId) {
      form.setValue("task_id", taskId);
    }
  }, [projectId, taskId, form]);

  // Când se schimbă proiectul, resetăm taskul
  useEffect(() => {
    const watchProject = form.watch("project_id");
    if (watchProject !== selectedProject) {
      setSelectedProject(watchProject);
      form.setValue("task_id", null);
    }
  }, [form.watch("project_id")]);

  // Mutație pentru adăugare manuală
  const createTimeLogMutation = useMutation({
    mutationFn: async (data: z.infer<typeof timeLogSchema>) => {
      const res = await apiRequest("POST", "/api/time-logs", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Eroare la salvarea timpului");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Succes",
        description: "Timpul a fost înregistrat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      onClose();
      form.reset({
        project_id: projectId || 0,
        task_id: taskId || null,
        date: new Date(),
        hours: 0,
        description: "",
        is_billable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut înregistra timpul",
        variant: "destructive",
      });
    },
  });

  // Mutație pentru pornirea timer-ului
  const startTimerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/time-logs", {
        ...data,
        start_time: new Date().toISOString(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Eroare la pornirea timer-ului");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Timer pornit",
        description: "Cronometrarea timpului a început",
      });
      setIsTracking(true);
      setStartTime(new Date());

      // Pornește temporizatorul pentru a actualiza timpul scurs
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      setTimerId(timer);

      form.setValue("task_id", data.task_id);
      form.setValue("project_id", data.project_id);
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut porni timer-ul",
        variant: "destructive",
      });
    },
  });

  // Mutație pentru oprirea timer-ului
  const stopTimerMutation = useMutation({
    mutationFn: async () => {
      // Acest ID ar trebui să fie stocat când timer-ul este pornit
      // Pentru simplitate, vom face o cerere nouă
      const res = await apiRequest("POST", "/api/time-logs", {
        project_id: form.getValues("project_id"),
        task_id: form.getValues("task_id"),
        date: new Date(),
        start_time: startTime?.toISOString(),
        end_time: new Date().toISOString(),
        description: form.getValues("description"),
        is_billable: form.getValues("is_billable"),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Eroare la oprirea timer-ului");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Timer oprit",
        description: "Cronometrarea timpului s-a oprit",
      });
      setIsTracking(false);
      setStartTime(null);
      setElapsedTime(0);
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut opri timer-ul",
        variant: "destructive",
      });
    },
  });

  // Formatare timp scurs
  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Curățare la închidere
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);

  // Handle submit pentru formularul de adăugare manuală
  const onSubmit = (data: z.infer<typeof timeLogSchema>) => {
    createTimeLogMutation.mutate(data);
  };

  // Handle pentru pornirea timer-ului
  const handleStartTimer = () => {
    if (!form.getValues("project_id")) {
      toast({
        title: "Eroare",
        description: "Selectați un proiect înainte de a porni timer-ul",
        variant: "destructive",
      });
      return;
    }

    startTimerMutation.mutate({
      project_id: form.getValues("project_id"),
      task_id: form.getValues("task_id"),
      date: new Date(),
      description: form.getValues("description"),
      is_billable: form.getValues("is_billable"),
    });
  };

  // Handle pentru oprirea timer-ului
  const handleStopTimer = () => {
    stopTimerMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isTimer ? "Cronometrare timp" : "Adaugă timp manual"}
          </DialogTitle>
          <DialogDescription>
            {isTimer
              ? "Cronometrează timpul de lucru pentru un task sau proiect"
              : "Adaugă manual timpul petrecut pe un task sau proiect"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-4"
          >
            {/* Proiect */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Proiect</FormLabel>
                  <Select
                    disabled={isLoadingProjects || isTracking}
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      setSelectedProject(parseInt(value));
                      form.setValue("task_id", null);
                    }}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați un proiect" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task */}
            <FormField
              control={form.control}
              name="task_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Task (opțional)</FormLabel>
                  <Select
                    disabled={isLoadingTasks || !selectedProject || isTracking}
                    onValueChange={(value) => field.onChange(value && value !== "null" ? parseInt(value) : null)}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați un task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Fără task specific</SelectItem>
                      {tasks?.map((task: any) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data */}
            {!isTimer && (
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        disabled={isTracking}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Ore (doar pentru adăugare manuală) */}
            {!isTimer && (
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Introduceți numărul de ore"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Puteți introduce și valori fracționare (ex: 1.5 = 1h 30m)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Timer (doar pentru cronometrare) */}
            {isTimer && (
              <div className="border rounded-md p-4">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold">{formatElapsedTime()}</div>
                  <div className="text-muted-foreground text-sm">
                    {isTracking ? "Cronometrarea este activă" : "Cronometrarea nu a început încă"}
                  </div>
                </div>
                <div className="flex justify-center">
                  {isTracking ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleStopTimer}
                      disabled={stopTimerMutation.isPending}
                    >
                      {stopTimerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Oprește
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleStartTimer}
                      disabled={startTimerMutation.isPending}
                    >
                      {startTimerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Pornește
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Descriere */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descriere (opțional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrieți activitatea efectuată"
                      {...field}
                      disabled={isTracking}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Facturabil */}
            <FormField
              control={form.control}
              name="is_billable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isTracking}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Facturabil</FormLabel>
                    <FormDescription>
                      Acest timp va fi inclus în rapoartele de facturare
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!isTimer && (
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createTimeLogMutation.isPending}
                >
                  {createTimeLogMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Salvează
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeTrackingModal;