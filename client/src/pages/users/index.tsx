import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Search, UserPlus, Check, X, Edit, Trash2, Shield, Mail, UserCircle, MoreHorizontal, UserCog, UserCheck } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Definirea tipurilor
type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'membru';
  status: 'activ' | 'inactiv' | 'invitat';
  avatar_url: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  organization_id: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

type Role = {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  organization_id: number;
};

type Permission = {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete' | 'manage';
  is_system: boolean;
};

type RoleWithPermissions = Role & {
  permissions: Permission[];
};

type Invitation = {
  id: number;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: number;
  invited_by_name: string;
  created_at: string;
  expires_at: string;
};

// Component principal pentru pagina Users
export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('membru');
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [permissionAssignments, setPermissionAssignments] = useState<Record<number, boolean>>({});
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obține lista de utilizatori
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca utilizatorii');
      }
      
      return await response.json();
    }
  });

  // Obține invitațiile
  const { data: invitations, isLoading: isLoadingInvitations, error: invitationsError } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations'],
    queryFn: async () => {
      const response = await fetch('/api/invitations', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca invitațiile');
      }
      
      return await response.json();
    }
  });

  // Obține rolurile și permisiunile
  const { data: roles, isLoading: isLoadingRoles, error: rolesError } = useQuery<RoleWithPermissions[]>({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca rolurile');
      }
      
      return await response.json();
    }
  });

  // Obține toate permisiunile disponibile
  const { data: permissions, isLoading: isLoadingPermissions, error: permissionsError } = useQuery<Permission[]>({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/permissions', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Nu s-au putut încărca permisiunile');
      }
      
      return await response.json();
    }
  });

  // Mutație pentru invitarea unui utilizator nou
  const inviteUserMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const response = await apiRequest('POST', '/api/invitations', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitație trimisă",
        description: "Utilizatorul a fost invitat cu succes",
      });
      setNewUserDialogOpen(false);
      setInviteEmail('');
      setInviteRole('membru');
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut trimite invitația",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru retrimirea unei invitații
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('POST', `/api/invitations/${invitationId}/resend`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitație retrimisă",
        description: "Invitația a fost retrimisă cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut retrimite invitația",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru anularea unei invitații
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest('DELETE', `/api/invitations/${invitationId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitație anulată",
        description: "Invitația a fost anulată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut anula invitația",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru crearea unui rol nou
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permission_ids: number[] }) => {
      const response = await apiRequest('POST', '/api/roles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rol creat",
        description: "Rolul a fost creat cu succes",
      });
      setNewRoleDialogOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setPermissionAssignments({});
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea rolul",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru actualizarea unui rol
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description: string; permission_ids: number[] }) => {
      const response = await apiRequest('PATCH', `/api/roles/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rol actualizat",
        description: "Rolul a fost actualizat cu succes",
      });
      setNewRoleDialogOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setPermissionAssignments({});
      setEditRoleId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza rolul",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru ștergerea unui rol
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await apiRequest('DELETE', `/api/roles/${roleId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rol șters",
        description: "Rolul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge rolul",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru actualizarea rolului unui utilizator
  const updateUserRoleMutation = useMutation({
    mutationFn: async (data: { userId: number; role: string }) => {
      const response = await apiRequest('PATCH', `/api/users/${data.userId}`, { role: data.role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rol actualizat",
        description: "Rolul utilizatorului a fost actualizat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza rolul utilizatorului",
        variant: "destructive",
      });
    }
  });

  // Mutație pentru dezactivarea/activarea unui utilizator
  const updateUserStatusMutation = useMutation({
    mutationFn: async (data: { userId: number; status: 'activ' | 'inactiv' }) => {
      const response = await apiRequest('PATCH', `/api/users/${data.userId}`, { status: data.status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status actualizat",
        description: "Statusul utilizatorului a fost actualizat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza statusul utilizatorului",
        variant: "destructive",
      });
    }
  });

  // Handler pentru invitarea unui utilizator nou
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast({
        title: "Eroare",
        description: "Adresa de email este obligatorie",
        variant: "destructive",
      });
      return;
    }
    
    inviteUserMutation.mutate({
      email: inviteEmail,
      role: inviteRole
    });
  };

  // Handler pentru crearea/actualizarea unui rol
  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoleName.trim()) {
      toast({
        title: "Eroare",
        description: "Numele rolului este obligatoriu",
        variant: "destructive",
      });
      return;
    }
    
    const permissionIds = Object.entries(permissionAssignments)
      .filter(([_, isAssigned]) => isAssigned)
      .map(([id]) => parseInt(id));
    
    if (editRoleId) {
      // Actualizare rol existent
      updateRoleMutation.mutate({
        id: editRoleId,
        name: newRoleName,
        description: newRoleDescription,
        permission_ids: permissionIds
      });
    } else {
      // Creare rol nou
      createRoleMutation.mutate({
        name: newRoleName,
        description: newRoleDescription,
        permission_ids: permissionIds
      });
    }
  };

  // Handler pentru editarea unui rol
  const handleEditRole = (role: RoleWithPermissions) => {
    setEditRoleId(role.id);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description);
    
    // Inițializează permisiunile asignate
    const initialPermissionAssignments: Record<number, boolean> = {};
    permissions?.forEach(permission => {
      initialPermissionAssignments[permission.id] = role.permissions.some(p => p.id === permission.id);
    });
    
    setPermissionAssignments(initialPermissionAssignments);
    setNewRoleDialogOpen(true);
  };

  // Filtrare utilizatori după termen de căutare
  const filteredUsers = users?.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
           user.email.toLowerCase().includes(searchLower) ||
           user.role.toLowerCase().includes(searchLower) ||
           (user.position && user.position.toLowerCase().includes(searchLower));
  });
  
  // Inițiale pentru avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };
  
  // Obține culoarea badge-ului pentru status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activ':
        return 'bg-green-100 text-green-800';
      case 'inactiv':
        return 'bg-gray-100 text-gray-800';
      case 'invitat':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Obține culoarea badge-ului pentru rol
  const getRoleBadgeClass = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'membru':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Grupează permisiunile după resursă
  const permissionsByResource = permissions?.reduce<Record<string, Permission[]>>((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {}) || {};

  // Resetează starea dialogului pentru rol nou
  const resetRoleDialog = () => {
    setEditRoleId(null);
    setNewRoleName('');
    setNewRoleDescription('');
    setPermissionAssignments({});
  };

  // Verifică dacă dialogul pentru rol este pentru editare
  const isEditMode = editRoleId !== null;
  
  // Conținut pentru tab-ul Utilizatori
  const UsersTabContent = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Caută utilizatori..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Invită utilizator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invită un utilizator nou</DialogTitle>
              <DialogDescription>
                Trimite o invitație prin email utilizatorului pe care dorești să-l adaugi.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplu.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Roluri</SelectLabel>
                        <SelectItem value="membru">Membru</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        {roles?.filter(r => !r.is_system).map(role => (
                          <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setNewUserDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit" disabled={inviteUserMutation.isPending}>
                  {inviteUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Invită
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoadingUsers ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă utilizatorii...</p>
        </div>
      ) : usersError ? (
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>
                {usersError instanceof Error ? usersError.message : "Nu s-au putut încărca utilizatorii"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultima autentificare</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-muted-foreground">{user.position || '-'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeClass(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        format(new Date(user.last_login), 'dd MMM yyyy, HH:mm', { locale: ro })
                      ) : (
                        <span className="text-muted-foreground text-sm">Niciodată</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Meniu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Link href={`/users/${user.id}`}>
                              <UserCircle className="mr-2 h-4 w-4" />
                              <span>Vezi profilul</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onSelect={() => updateUserStatusMutation.mutate({
                              userId: user.id,
                              status: user.status === 'activ' ? 'inactiv' : 'activ'
                            })}
                          >
                            {user.status === 'activ' ? (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                <span>Dezactivează</span>
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                <span>Activează</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {}}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Trimite email</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => {}}>
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Schimbă rolul</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    {searchTerm ? (
                      <div>Nu s-au găsit utilizatori care să corespundă căutării.</div>
                    ) : (
                      <div>Nu există utilizatori în organizație.</div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
  
  // Conținut pentru tab-ul Invitații
  const InvitationsTabContent = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setNewUserDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Invită utilizator
        </Button>
      </div>
      
      {isLoadingInvitations ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă invitațiile...</p>
        </div>
      ) : invitationsError ? (
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>
                {invitationsError instanceof Error ? invitationsError.message : "Nu s-au putut încărca invitațiile"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invitat de</TableHead>
                <TableHead>Data invitării</TableHead>
                <TableHead>Expiră</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations && invitations.length > 0 ? (
                invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeClass(invitation.role)}>
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(invitation.status)}>
                        {invitation.status === 'pending' ? 'În așteptare' : 
                         invitation.status === 'accepted' ? 'Acceptată' : 'Expirată'}
                      </Badge>
                    </TableCell>
                    <TableCell>{invitation.invited_by_name}</TableCell>
                    <TableCell>
                      {format(new Date(invitation.created_at), 'dd MMM yyyy, HH:mm', { locale: ro })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invitation.expires_at), 'dd MMM yyyy, HH:mm', { locale: ro })}
                    </TableCell>
                    <TableCell className="text-right">
                      {invitation.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvitationMutation.mutate(invitation.id)}
                            disabled={resendInvitationMutation.isPending}
                          >
                            {resendInvitationMutation.isPending && (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            )}
                            Retrimite
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                            disabled={cancelInvitationMutation.isPending}
                          >
                            {cancelInvitationMutation.isPending && (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            )}
                            Anulează
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div>Nu există invitații active.</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
  
  // Conținut pentru tab-ul Roluri și Permisiuni
  const RolesAndPermissionsTabContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Roluri și Permisiuni</h2>
        <Dialog 
          open={newRoleDialogOpen} 
          onOpenChange={(open) => {
            setNewRoleDialogOpen(open);
            if (!open) resetRoleDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Shield className="mr-2 h-4 w-4" /> Adaugă rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Editează rol' : 'Adaugă rol nou'}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? 'Modificați detaliile și permisiunile rolului.'
                  : 'Creați un rol nou și asignați permisiunile corespunzătoare.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRoleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role-name">Nume rol</Label>
                  <Input
                    id="role-name"
                    placeholder="Ex: Manager Proiecte"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role-description">Descriere</Label>
                  <Input
                    id="role-description"
                    placeholder="Ex: Gestionează echipa și proiectele"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-4 mt-4">
                  <Label>Permisiuni</Label>
                  <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                    {Object.entries(permissionsByResource).map(([resource, perms]) => (
                      <div key={resource} className="mb-6">
                        <h4 className="font-medium mb-2 capitalize">{resource}</h4>
                        <Separator className="mb-3" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {perms.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Switch 
                                id={`permission-${permission.id}`}
                                checked={permissionAssignments[permission.id] || false}
                                onCheckedChange={(checked) => {
                                  setPermissionAssignments(prev => ({
                                    ...prev,
                                    [permission.id]: checked
                                  }));
                                }}
                              />
                              <Label 
                                htmlFor={`permission-${permission.id}`}
                                className="flex flex-col cursor-pointer"
                              >
                                <span>{permission.name}</span>
                                <span className="text-xs text-muted-foreground">{permission.description}</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => {
                  setNewRoleDialogOpen(false);
                  resetRoleDialog();
                }}>
                  Anulează
                </Button>
                <Button 
                  type="submit" 
                  disabled={isEditMode 
                    ? updateRoleMutation.isPending 
                    : createRoleMutation.isPending}
                >
                  {(isEditMode 
                    ? updateRoleMutation.isPending 
                    : createRoleMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? 'Salvează modificările' : 'Creează rol'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoadingRoles ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Se încarcă rolurile...</p>
        </div>
      ) : rolesError ? (
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>
                {rolesError instanceof Error ? rolesError.message : "Nu s-au putut încărca rolurile"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles?.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription>{role.description || 'Fără descriere'}</CardDescription>
                  </div>
                  {!role.is_system && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Meniu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditRole(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editează</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onSelect={() => {
                            if (window.confirm(`Sigur doriți să ștergeți rolul "${role.name}"?`)) {
                              deleteRoleMutation.mutate(role.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Șterge</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <h4 className="text-sm font-medium mb-2">Permisiuni ({role.permissions.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((permission) => (
                      <Badge key={permission.id} variant="outline">
                        {permission.name}
                      </Badge>
                    ))}
                    {role.permissions.length > 5 && (
                      <Badge variant="outline">
                        +{role.permissions.length - 5} alte permisiuni
                      </Badge>
                    )}
                  </div>
                </div>
                {role.is_system && (
                  <div className="mt-3">
                    <Badge variant="secondary">Rol de sistem</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Utilizatori și Permisiuni</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center">
              <UserCheck className="mr-2 h-4 w-4" />
              Utilizatori
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              Invitații
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Roluri și Permisiuni
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UsersTabContent />
          </TabsContent>
          
          <TabsContent value="invitations">
            <InvitationsTabContent />
          </TabsContent>
          
          <TabsContent value="roles">
            <RolesAndPermissionsTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}