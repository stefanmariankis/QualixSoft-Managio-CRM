import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
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
  Phone,
  AtSign,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  Check,
  X,
  Edit,
  Trash2,
  Calendar,
  BarChart4,
  Layers
} from "lucide-react";
import { TeamMember, teamMemberRoles } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";

export default function TeamMemberDetailsPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("detalii");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const memberId = parseInt(id);

  // Obținem datele membrului
  const { data: member, isLoading, isError } = useQuery({
    queryKey: [`/api/team/${memberId}`],
  });

  // Obținem departamentele membrului
  const { data: departments, isLoading: loadingDepartments } = useQuery({
    queryKey: [`/api/team/${memberId}/departments`],
  });

  // Configurare form pentru editare
  const form = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "",
      position: "",
      bio: "",
      hourly_rate: 0,
      is_active: true,
    }
  });

  // Update form values when member data is loaded
  useState(() => {
    if (member) {
      form.reset({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone || "",
        role: member.role,
        position: member.position || "",
        bio: member.bio || "",
        hourly_rate: member.hourly_rate || 0,
        is_active: member.is_active,
      });
    }
  });

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      employee: "bg-blue-100 text-blue-800",
      colaborator: "bg-green-100 text-green-800",
      manager: "bg-purple-100 text-purple-800",
      director: "bg-indigo-100 text-indigo-800",
      super_admin: "bg-red-100 text-red-800",
      ceo: "bg-amber-100 text-amber-800",
    };
    return roleColors[role] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      employee: "Angajat",
      colaborator: "Colaborator",
      manager: "Manager",
      director: "Director",
      super_admin: "Administrator",
      ceo: "CEO",
    };
    return roleLabels[role] || role;
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast({
          title: "Succes",
          description: "Datele membrului au fost actualizate cu succes",
        });
        setIsEditing(false);
        queryClient.invalidateQueries([`/api/team/${memberId}`]);
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
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Succes",
          description: "Membrul a fost șters cu succes",
        });
        setLocation('/team');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "A apărut o eroare");
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "A apărut o eroare la ștergerea membrului",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !member) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">Eroare</h1>
          <p className="text-muted-foreground">Nu am putut încărca detaliile membrului.</p>
          <Button className="mt-4" onClick={() => setLocation('/team')}>
            Înapoi la listă
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const userInitials = `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Header cu butoane de acțiune */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setLocation('/team')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Detalii membru</h1>
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
                    Sunteți sigur că doriți să ștergeți membrul {member.first_name} {member.last_name}? Această acțiune este ireversibilă.
                    {departments && departments.length > 0 && (
                      <p className="mt-2 text-red-600">
                        Atenție! Acest membru face parte din {departments.length} departament(e). Ștergerea lui va afecta structura departamentelor.
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
              <CardTitle>Editează detaliile membrului</CardTitle>
              <CardDescription>
                Actualizează informațiile despre membrul echipei
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prenume</FormLabel>
                          <FormControl>
                            <Input placeholder="Prenume" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nume</FormLabel>
                          <FormControl>
                            <Input placeholder="Nume" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon</FormLabel>
                          <FormControl>
                            <Input placeholder="Număr de telefon" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează rolul" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teamMemberRoles.map(role => (
                                <SelectItem key={role} value={role}>
                                  {getRoleLabel(role)}
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
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poziție</FormLabel>
                          <FormControl>
                            <Input placeholder="Poziție" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rată orară (RON)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Rată orară" 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Status activ</FormLabel>
                            <FormDescription>
                              Membrii inactivi nu vor putea accesa platforma.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biografie</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Biografie și experiență profesională" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                <TabsTrigger value="departamente">Departamente</TabsTrigger>
                <TabsTrigger value="proiecte">Proiecte</TabsTrigger>
              </TabsList>
              
              {/* Tab: Detalii */}
              <TabsContent value="detalii" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card informații de bază */}
                  <Card className="md:col-span-1">
                    <CardHeader className="flex-center flex-col items-center text-center">
                      <div className="mb-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={member.avatar || ''} alt={`${member.first_name} ${member.last_name}`} />
                          <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle>{member.first_name} {member.last_name}</CardTitle>
                      <CardDescription className="flex flex-col items-center gap-2">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                        {member.position && (
                          <span className="text-sm">{member.position}</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <AtSign className="h-4 w-4 text-muted-foreground" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{member.hourly_rate ? `${member.hourly_rate} RON/oră` : 'Rată orară nespecificată'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.is_active ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Activ</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Inactiv</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Card biografie și detalii */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Biografie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {member.bio ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {member.bio}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Nu există informații biografice disponibile.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Tab: Departamente */}
              <TabsContent value="departamente" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Departamente</CardTitle>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Adaugă în departament
                      </Button>
                    </div>
                    <CardDescription>
                      Departamentele din care face parte acest membru.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingDepartments ? (
                      <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : departments && departments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {departments.map((dep: any) => (
                          <Card key={dep.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                {dep.department.name}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {dep.is_manager ? 'Manager departament' : 'Membru departament'}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-2 flex justify-between">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/departments/${dep.department_id}`}>
                                  Vezi departament
                                </Link>
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Elimină din departament</DialogTitle>
                                    <DialogDescription>
                                      Ești sigur că vrei să elimini acest membru din departamentul {dep.department.name}?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      onClick={async () => {
                                        // Implementare pentru eliminarea din departament
                                      }}
                                    >
                                      Elimină
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Building2 className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Niciun departament</h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-2">
                          Acest membru nu face parte din niciun departament. Adaugă-l într-un departament folosind butonul de mai sus.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Tab: Proiecte */}
              <TabsContent value="proiecte" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Proiecte</CardTitle>
                    <CardDescription>
                      Proiectele la care lucrează acest membru.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Layers className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Niciun proiect</h3>
                      <p className="text-sm text-muted-foreground max-w-md mt-2">
                        Acest membru nu este asociat cu niciun proiect momentan.
                      </p>
                    </div>
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