import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  User,
  Users,
  Building2,
  Edit,
  Trash2,
  Plus,
  X,
  Shield,
  HelpCircle,
  ChevronsUpDown
} from "lucide-react";
import { Department } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";

export default function DepartmentDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { organization } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("detalii");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  const departmentId = parseInt(id);

  // Verificare dacă departamentele sunt activate în organizație
  const hasDepartments = organization?.has_departments ?? false;

  // Obținem datele departamentului
  const { data: department, isLoading, isError } = useQuery({
    queryKey: [`/api/departments/${departmentId}`],
    enabled: hasDepartments, // Nu facem query dacă departamentele nu sunt activate
  });

  // Obținem membrii departamentului
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: [`/api/departments/${departmentId}/members`],
    enabled: hasDepartments, // Nu facem query dacă departamentele nu sunt activate
  });

  // Obținem toți membrii echipei pentru a-i putea adăuga în departament
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/team"],
    enabled: hasDepartments, // Nu facem query dacă departamentele nu sunt activate
  });

  // Configurare form pentru editare
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      manager_id: null,
    }
  });

  // Update form values when department data is loaded
  useState(() => {
    if (department) {
      form.reset({
        name: department.name,
        description: department.description || "",
        manager_id: department.manager_id || null,
      });
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast({
          title: "Succes",
          description: "Datele departamentului au fost actualizate cu succes",
        });
        setIsEditing(false);
        queryClient.invalidateQueries([`/api/departments/${departmentId}`]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "A apărut o eroare");
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la actualizarea datelor",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Succes",
          description: "Departamentul a fost șters cu succes",
        });
        setLocation('/departments');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "A apărut o eroare");
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la ștergerea departamentului",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (memberId: number, isManager: boolean) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_member_id: memberId,
          is_manager: isManager
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Succes",
          description: "Membrul a fost adăugat în departament cu succes",
        });
        setAddMemberDialogOpen(false);
        queryClient.invalidateQueries([`/api/departments/${departmentId}/members`]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "A apărut o eroare");
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la adăugarea membrului",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (membershipId: number) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}/members/${membershipId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Succes",
          description: "Membrul a fost eliminat din departament cu succes",
        });
        queryClient.invalidateQueries([`/api/departments/${departmentId}/members`]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "A apărut o eroare");
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la eliminarea membrului",
        variant: "destructive",
      });
    }
  };

  const handleToggleManager = async (membershipId: number, isCurrentlyManager: boolean) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}/members/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_manager: !isCurrentlyManager
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Succes",
          description: `Membrul a fost ${!isCurrentlyManager ? 'promovat la manager' : 'retrogradat din funcția de manager'} cu succes`,
        });
        queryClient.invalidateQueries([`/api/departments/${departmentId}/members`]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "A apărut o eroare");
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la modificarea rolului",
        variant: "destructive",
      });
    }
  };

  if (!hasDepartments) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-2">Departamentele nu sunt activate</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Funcționalitatea de departamente nu este activată în organizația dumneavoastră.
            Activați această funcționalitate din setările organizației pentru a putea gestiona departamentele.
          </p>
          <Button asChild>
            <Link href="/settings/organization">
              Mergi la setările organizației
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !department) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">Eroare</h1>
          <p className="text-muted-foreground">Nu am putut încărca detaliile departamentului.</p>
          <Button className="mt-4" onClick={() => setLocation('/departments')}>
            Înapoi la listă
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Filtrăm membrii echipei care nu sunt deja în departament
  const getAvailableMembers = () => {
    if (!teamMembers || !members) return [];
    
    const existingMemberIds = members.map((m: any) => m.member.id);
    return teamMembers.filter((tm: any) => !existingMemberIds.includes(tm.id));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Header cu butoane de acțiune */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setLocation('/departments')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Detalii departament</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="mr-2 h-4 w-4" /> Editează
            </Button>
            
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Șterge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmă ștergerea</DialogTitle>
                  <DialogDescription>
                    Sunteți sigur că doriți să ștergeți departamentul {department.name}? Această acțiune este ireversibilă.
                    {members && members.length > 0 && (
                      <p className="mt-2 text-red-600">
                        Atenție! Acest departament are {members.length} membri. Ștergerea lui va afecta acești membri.
                      </p>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Anulează
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Șterge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Editează detaliile departamentului</CardTitle>
              <CardDescription>
                Actualizează informațiile despre departament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nume departament</FormLabel>
                          <FormControl>
                            <Input placeholder="Numele departamentului" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descriere</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descrierea departamentului" 
                              className="min-h-[120px]" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="manager_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager departament</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează un manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Fără manager</SelectItem>
                              {teamMembers && teamMembers.map((member: any) => (
                                <SelectItem key={member.id} value={member.id.toString()}>
                                  {member.first_name} {member.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Managerul departamentului are responsabilități speciale în gestionarea activităților.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Anulează
                    </Button>
                    <Button type="submit">
                      Salvează modificările
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tab-uri pentru diferite secțiuni */}
            <Tabs defaultValue="detalii" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="detalii">Detalii</TabsTrigger>
                <TabsTrigger value="membri">Membri ({members ? members.length : 0})</TabsTrigger>
              </TabsList>
              
              {/* Tab: Detalii */}
              <TabsContent value="detalii" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informații departament</CardTitle>
                    <CardDescription>
                      Detalii despre departamentul {department.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Nume</h3>
                        <p className="text-sm">{department.name}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Manager</h3>
                        <p className="text-sm">
                          {department.manager_id ? (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                              {/* Aici ar trebui afișat numele managerului */}
                              Manager asignat (ID: {department.manager_id})
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground italic">Fără manager desemnat</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Descriere</h3>
                      <p className="text-sm whitespace-pre-line">
                        {department.description || <span className="text-muted-foreground italic">Fără descriere</span>}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Tab: Membri departament */}
              <TabsContent value="membri" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Membrii departamentului</CardTitle>
                      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Adaugă membru
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adaugă membru nou</DialogTitle>
                            <DialogDescription>
                              Selectează un membru al echipei pentru a-l adăuga în acest departament.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            {getAvailableMembers().length > 0 ? (
                              <div className="space-y-4">
                                <div className="grid max-h-[300px] gap-2 overflow-y-auto p-1">
                                  {getAvailableMembers().map((member: any) => (
                                    <div 
                                      key={member.id} 
                                      className="flex items-center justify-between rounded-md border p-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                          <User className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                          <div className="font-medium">{member.first_name} {member.last_name}</div>
                                          <div className="text-xs text-muted-foreground">{member.email}</div>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleAddMember(member.id, false)}
                                        >
                                          Adaugă ca membru
                                        </Button>
                                        <Button 
                                          variant="default" 
                                          size="sm"
                                          onClick={() => handleAddMember(member.id, true)}
                                        >
                                          Adaugă ca manager
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 text-center">
                                <HelpCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Nu mai există membri disponibili pentru a fi adăugați în acest departament.
                                </p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <CardDescription>
                      Persoanele care fac parte din acest departament.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMembers ? (
                      <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : members && members.length > 0 ? (
                      <div className="space-y-3">
                        {members.map((membership: any) => (
                          <div 
                            key={membership.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {membership.member.first_name} {membership.member.last_name}
                                  {membership.is_manager && (
                                    <Badge className="ml-2 bg-purple-100 text-purple-800">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Manager
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{membership.member.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleToggleManager(membership.id, membership.is_manager)}
                              >
                                {membership.is_manager ? 'Retrogradează' : 'Promovează la manager'}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="icon"
                                onClick={() => handleRemoveMember(membership.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Users className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Niciun membru</h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-2">
                          Acest departament nu are încă niciun membru. Adaugă membri folosind butonul de mai sus.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}