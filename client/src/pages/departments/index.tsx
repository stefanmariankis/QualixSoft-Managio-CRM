import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/context/auth-context";
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
  Edit,
  Trash2,
  Users,
  Building2,
  HelpCircle
} from "lucide-react";
import { Department } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function DepartmentsPage() {
  const { organization } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Verificare dacă departamentele sunt activate în organizație
  const hasDepartments = organization?.has_departments ?? false;

  // Apel API real către server
  const { data: departments, isLoading, refetch } = useQuery({
    queryKey: ["/api/departments"],
    enabled: hasDepartments, // Nu facem query dacă departamentele nu sunt activate
  });

  // Filtrare departamente
  const filteredDepartments = departments && Array.isArray(departments)
    ? departments.filter(department => {
        // Filtrare după termen de căutare
        const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch;
      })
    : [];

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

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Header cu titlu și buton de adăugare */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Departamente</h1>
            <p className="text-muted-foreground">
              Gestionează structura organizațională pe departamente
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Adaugă departament
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă departament nou</DialogTitle>
                <DialogDescription>
                  Completează informațiile pentru a adăuga un departament nou.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Form pentru adăugare departament va fi implementat aici */}
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
                  placeholder="Caută după nume sau descriere..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabel departamente */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredDepartments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume departament</TableHead>
                    <TableHead className="hidden md:table-cell">Descriere</TableHead>
                    <TableHead className="hidden md:table-cell">Manager</TableHead>
                    <TableHead className="hidden md:table-cell">Număr membri</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((department: Department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div>{department.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                        {department.description || <span className="text-muted-foreground italic">Fără descriere</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {department.manager_id ? (
                          <Badge variant="outline">
                            Manager asignat
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Fără manager
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className="bg-blue-100 text-blue-800">
                          <Users className="h-3 w-3 mr-1" />
                          0 membri
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/departments/${department.id}`}>
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
                                  Ești sigur că vrei să ștergi departamentul {department.name}?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/departments/${department.id}`, {
                                        method: 'DELETE',
                                      });
                                      
                                      if (response.ok) {
                                        toast({
                                          title: "Succes",
                                          description: `Departamentul ${department.name} a fost șters cu succes.`,
                                        });
                                        refetch();
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
                <h3 className="text-lg font-medium">Niciun departament găsit</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  {searchTerm
                    ? "Nu am găsit niciun departament care să corespundă criteriilor de căutare."
                    : "Nu există încă niciun departament. Adaugă primul departament folosind butonul de mai sus."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}