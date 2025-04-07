import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  AtSign,
  User,
  Building2,
  HelpCircle,
  DollarSign
} from "lucide-react";
import { Department, TeamMember, TeamMemberFormData, teamMemberRoles, teamMemberSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("toate");
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const { toast } = useToast();
  const { organization } = useAuth();

  // Verifică dacă organizația are departamente activate
  const hasDepartments = organization?.has_departments ?? false;

  // Apel API real către server
  const { data: teamMembers, isLoading, refetch } = useQuery({
    queryKey: ["/api/team"],
  });

  // Obține departamente dacă e cazul
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    enabled: hasDepartments, // Nu face query dacă departamentele nu sunt activate
  });

  // Formular de adăugare membru nou
  const form = useForm<TeamMemberFormData & { department_id?: number }>({
    resolver: zodResolver(teamMemberSchema.extend({
      department_id: z.number().optional()
    })),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "employee",
      position: "",
      bio: "",
      hourly_rate: 0,
      is_active: true,
      department_id: undefined,
    },
  });

  // Mutație pentru adăugare membru nou
  const addMemberMutation = useMutation({
    mutationFn: async (formData: TeamMemberFormData & { department_id?: number }) => {
      const res = await apiRequest("POST", "/api/team", formData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "A apărut o eroare la adăugarea membrului");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Succes",
        description: "Membrul a fost adăugat cu succes în echipă",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setAddMemberDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler pentru submit
  const onSubmit = (data: TeamMemberFormData & { department_id?: number }) => {
    addMemberMutation.mutate(data);
  };

  // Filtrare membrii echipei
  const filteredMembers = teamMembers && Array.isArray(teamMembers)
    ? teamMembers.filter(member => {
        // Filtrare după termen de căutare
        const matchesSearch =
          `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (member.phone && member.phone.includes(searchTerm));

        // Filtrare după rol
        const matchesRole = filterRole === "toate" || member.role === filterRole;

        return matchesSearch && matchesRole;
      })
    : [];

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

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Header cu titlu și buton de adăugare */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Echipă</h1>
            <p className="text-muted-foreground">
              Gestionează membrii echipei și colaboratorii
            </p>
          </div>
          <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Adaugă membru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Adaugă membru nou</DialogTitle>
                <DialogDescription>
                  Completează informațiile pentru a adăuga un membru nou în echipă.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prenume *</FormLabel>
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
                          <FormLabel>Nume *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nume" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} />
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
                          <Input placeholder="Telefon" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Alege rolul" />
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
                            <Input placeholder="Poziție" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rată orară (opțional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                            value={field.value === null || field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Suma în RON per oră de lucru
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Selectorul de departament - apare doar dacă organizația are departamente activate */}
                  {hasDepartments && (
                    <FormField
                      control={form.control}
                      name="department_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departament</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                            value={field.value ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Alege departamentul" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Fără departament</SelectItem>
                              {departments && Array.isArray(departments) && departments.map((dept: Department) => (
                                <SelectItem key={dept.id} value={String(dept.id)}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selectează un departament pentru acest membru (opțional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biografie</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Scurtă descriere a membrului echipei"
                            {...field}
                            value={field.value || ''}
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Status activ</FormLabel>
                          <FormDescription>
                            Marchează ca inactiv pentru a dezactiva temporar contul
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
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addMemberMutation.isPending}
                    >
                      {addMemberMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">◌</span>
                          Se adaugă...
                        </>
                      ) : (
                        "Adaugă membru"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtre și căutare */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">Filtre și căutare</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Caută după nume, email sau telefon..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrează după rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toate">Toate rolurile</SelectItem>
                  {teamMemberRoles.map(role => (
                    <SelectItem key={role} value={role}>{getRoleLabel(role)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabel membrii echipei */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Telefon</TableHead>
                    <TableHead className="hidden md:table-cell">Rol</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member: TeamMember) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div>{member.first_name} {member.last_name}</div>
                            <div className="text-sm text-muted-foreground md:hidden">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <AtSign className="h-4 w-4 text-muted-foreground" />
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {member.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {member.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={getStatusBadgeColor(member.is_active)}>
                          {member.is_active ? "Activ" : "Inactiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/team/${member.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editează</span>
                            </Link>
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Șterge</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirmare ștergere</DialogTitle>
                                <DialogDescription>
                                  Ești sigur că vrei să ștergi membrul {member.first_name} {member.last_name} din echipă?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/team/${member.id}`, {
                                        method: 'DELETE',
                                      });
                                      
                                      if (response.ok) {
                                        toast({
                                          title: "Succes",
                                          description: `Membrul ${member.first_name} ${member.last_name} a fost șters cu succes.`,
                                        });
                                        refetch();
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
                                  }}
                                >
                                  Șterge
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <HelpCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Niciun membru găsit</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  {searchTerm || filterRole !== "toate"
                    ? "Nu am găsit niciun membru care să corespundă criteriilor de căutare. Încearcă alte filtre."
                    : "Nu există încă niciun membru în echipă. Adaugă primul membru folosind butonul de mai sus."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}