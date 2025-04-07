import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { TeamMember, teamMemberRoles } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("toate");
  const { toast } = useToast();

  // Apel API real către server
  const { data: teamMembers, isLoading, refetch } = useQuery({
    queryKey: ["/api/team"],
  });

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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Adaugă membru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă membru nou</DialogTitle>
                <DialogDescription>
                  Completează informațiile pentru a adăuga un membru nou în echipă.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Form pentru adăugare membru va fi implementat aici */}
                <p className="text-sm text-muted-foreground">
                  Implementarea formularului va fi disponibilă curând.
                </p>
              </div>
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