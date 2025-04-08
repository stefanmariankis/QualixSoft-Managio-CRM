import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTimeTracking } from "@/context/time-tracking-context";
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
  duration_minutes: z.number({
    required_error: "Introduceți durata în minute",
  }).min(1, "Durata trebuie să fie mai mare de 0 minute"),
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
  const { timer, startTimer, stopTimer } = useTimeTracking();
  const [selectedProject, setSelectedProject] = useState<number | null>(projectId || null);
  const [isLoading, setIsLoading] = useState(false);

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
    queryKey: ["/api/projects", selectedProject, "tasks"],
    queryFn: async () => {
      if (!selectedProject) return [];
      const res = await apiRequest(
        "GET",
        `/api/projects/${selectedProject}/tasks`
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
      duration_minutes: 0,
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
        duration_minutes: 0,
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

  // Folosim acum time tracking context în loc de mutații locale

  // Formatare timp scurs
  const formatElapsedTime = () => {
    const hours = Math.floor(timer.elapsedTime / 3600);
    const minutes = Math.floor((timer.elapsedTime % 3600) / 60);
    const seconds = timer.elapsedTime % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle submit pentru formularul de adăugare manuală
  const onSubmit = (data: z.infer<typeof timeLogSchema>) => {
    createTimeLogMutation.mutate(data);
  };

  // Handle pentru pornirea timer-ului
  const handleStartTimer = async () => {
    if (!form.getValues("project_id")) {
      toast({
        title: "Eroare",
        description: "Selectați un proiect înainte de a porni timer-ul",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const projectId = form.getValues("project_id");
      const taskId = form.getValues("task_id");
      
      // Obținem proiectul selectat
      const selectedProjectObj = projects?.find((p: any) => p.id === projectId);
      const projectName = selectedProjectObj?.name || "Proiect necunoscut";
      
      // Obținem task-ul selectat, dacă există
      const selectedTaskObj = tasks?.find((t: any) => t.id === taskId);
      const taskName = selectedTaskObj?.title || null;
      
      // Pornim timer-ul în context-ul global
      await startTimer(projectId, taskId, projectName, taskName);
      
      toast({
        title: "Timer pornit",
        description: "Cronometrarea timpului a început",
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut porni timer-ul",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pentru oprirea timer-ului
  const handleStopTimer = async () => {
    setIsLoading(true);
    try {
      await stopTimer();
      
      toast({
        title: "Timer oprit",
        description: "Cronometrarea timpului s-a oprit",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut opri timer-ul", 
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                    disabled={isLoadingProjects || timer.isActive}
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
                    disabled={isLoadingTasks || !selectedProject || timer.isActive}
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
                        disabled={timer.isActive}
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
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Introduceți durata în ore"
                        value={field.value > 0 ? (field.value / 60).toFixed(2) : ""}
                        onChange={(e) => {
                          // Convertim orele în minute (1 oră = 60 minute)
                          const hours = parseFloat(e.target.value);
                          const minutes = Math.round(hours * 60);
                          field.onChange(minutes);
                        }}
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
                    {timer.isActive ? "Cronometrarea este activă" : "Cronometrarea nu a început încă"}
                  </div>
                </div>
                <div className="flex justify-center">
                  {timer.isActive ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleStopTimer}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Oprește
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleStartTimer}
                      disabled={isLoading}
                    >
                      {isLoading ? (
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
                      disabled={timer.isActive}
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
                      disabled={timer.isActive}
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