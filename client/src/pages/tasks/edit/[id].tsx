import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().min(3, "Titlul trebuie să aibă cel puțin 3 caractere"),
  description: z.string().optional().nullable(),
  status: z.string(),
  priority: z.string(),
  due_date: z.date().optional().nullable(),
  estimated_hours: z.coerce.number().min(0).optional().nullable(),
  project_id: z.coerce.number(),
  assignee_id: z.coerce.number().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type Project = {
  id: number;
  name: string;
  organization_id: number;
  client_id: number;
  client_name?: string;
};

type User = {
  id: number;
  name: string;
  role: string;
  email: string;
  department_id?: number | null;
  department_name?: string | null;
};

export default function EditTask() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const taskId = parseInt(params.id);
  const { toast } = useToast();

  // Obține detaliile inițiale ale task-ului
  const { data: taskData, isLoading: isLoadingTask, error: taskError } = useQuery({
    queryKey: ['/api/tasks', taskId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca detaliile task-ului');
      }
      return response.json();
    }
  });

  // Obține lista de proiecte
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca proiectele');
      }
      return response.json();
    }
  });

  // Obține lista de utilizatori
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users/organization'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/organization');
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca utilizatorii');
      }
      return response.json();
    }
  });

  // Inițializează formularul
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'not_started',
      priority: 'medium',
      due_date: null,
      estimated_hours: null,
      project_id: 0,
      assignee_id: null,
    }
  });

  // Actualizează valorile implicite când sunt disponibile datele
  useEffect(() => {
    if (taskData?.task) {
      const task = taskData.task;
      form.reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? new Date(task.due_date) : null,
        estimated_hours: task.estimated_hours,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
      });
    }
  }, [taskData, form]);

  // Mutația pentru actualizarea task-ului
  const updateTaskMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, values);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nu s-a putut actualiza task-ul');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task actualizat",
        description: "Task-ul a fost actualizat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
      setLocation('/tasks');
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza task-ul",
        variant: "destructive",
      });
    }
  });

  // Handler pentru submiterea formularului
  const onSubmit = (values: TaskFormValues) => {
    updateTaskMutation.mutate(values);
  };

  // Dacă se încarcă datele, afișăm un loader
  if (isLoadingTask || isLoadingProjects || isLoadingUsers) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă datele task-ului...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Dacă există o eroare, o afișăm
  if (taskError || !taskData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Alert className="max-w-md" variant="destructive">
            <AlertTitle>Eroare</AlertTitle>
            <AlertDescription>
              {taskError instanceof Error ? taskError.message : "Nu s-au putut încărca detaliile task-ului"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => setLocation('/tasks')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi la lista de task-uri
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setLocation(`/tasks/${taskId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Editare task: {taskData.task.title}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalii task</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titlu</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Introdu titlul task-ului" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proiect</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează proiectul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects?.map(project => (
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

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează statusul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_started">De făcut</SelectItem>
                            <SelectItem value="in_progress">În lucru</SelectItem>
                            <SelectItem value="under_review">În verificare</SelectItem>
                            <SelectItem value="completed">Finalizat</SelectItem>
                            <SelectItem value="on_hold">Blocat</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioritate</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează prioritatea" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Scăzută</SelectItem>
                            <SelectItem value="medium">Medie</SelectItem>
                            <SelectItem value="high">Ridicată</SelectItem>
                            <SelectItem value="urgent">Urgentă</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Dată finalizare</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Alege data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ore estimate</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.5"
                            min="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="Estimare ore"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asignat către</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === '' ? null : parseInt(value))}
                          defaultValue={field.value?.toString() || ''}
                          value={field.value?.toString() || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează un utilizator" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Neasignat</SelectItem>
                            {users?.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} {user.department_name ? `(${user.department_name})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descriere</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value || ''}
                          placeholder="Descriere task" 
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation(`/tasks/${taskId}`)}
                  >
                    Anulare
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateTaskMutation.isPending}
                  >
                    {updateTaskMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvare
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}