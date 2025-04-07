import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import DashboardLayout from '@/components/layout/dashboard-layout';

export default function SettingsPage() {
  const { toast } = useToast();
  const [hasDepartments, setHasDepartments] = useState(false);
  
  // Verifică organizația curentă pentru a afla dacă are departamente activate
  const { data: organization, isLoading } = useQuery({
    queryKey: ["/api/organization"],
  });
  
  // Actualizăm starea atunci când datele organizației se schimbă
  useEffect(() => {
    if (organization && organization.has_departments !== undefined) {
      setHasDepartments(organization.has_departments);
    }
  }, [organization]);
  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Setări</h1>
          <p className="text-muted-foreground">
            Configurează preferințele pentru organizație și cont
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="organization">Organizație</TabsTrigger>
            <TabsTrigger value="notifications">Notificări</TabsTrigger>
            <TabsTrigger value="security">Securitate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profil Utilizator</CardTitle>
                <CardDescription>
                  Actualizează informațiile profilului tău
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prenume</Label>
                      <Input id="first_name" placeholder="Prenume" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nume</Label>
                      <Input id="last_name" placeholder="Nume" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@exemplu.com" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" placeholder="Telefon" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Funcție</Label>
                      <Input id="job_title" placeholder="Funcție" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Salvează modificările</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="organization" className="mt-4">
            <Tabs defaultValue="general" className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="structure">Structură organizațională</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Informații generale</CardTitle>
                    <CardDescription>
                      Configurează setările organizației tale
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Informații de bază</h3>
                        <Separator />
                        
                        <div className="space-y-2">
                          <Label htmlFor="org_name">Nume organizație</Label>
                          <Input id="org_name" placeholder="Nume organizație" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="org_email">Email organizație</Label>
                            <Input id="org_email" type="email" placeholder="contact@organizatie.ro" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="org_phone">Telefon organizație</Label>
                            <Input id="org_phone" placeholder="Telefon" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="org_address">Adresă</Label>
                          <Input id="org_address" placeholder="Adresă" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Date fiscale</h3>
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="org_fiscal_code">Cod fiscal</Label>
                            <Input id="org_fiscal_code" placeholder="CUI/CIF" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="org_reg_number">Număr înregistrare</Label>
                            <Input id="org_reg_number" placeholder="J00/000/0000" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="org_bank_account">Cont bancar</Label>
                          <Input id="org_bank_account" placeholder="ROXX XXXX XXXX XXXX XXXX XXXX" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="org_bank_name">Bancă</Label>
                          <Input id="org_bank_name" placeholder="Nume bancă" />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button>Salvează modificările</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="structure">
                <Card>
                  <CardHeader>
                    <CardTitle>Structură organizațională</CardTitle>
                    <CardDescription>
                      Configurează cum este structurată organizația ta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2 h-5 w-5 text-primary"
                            >
                              <path d="M2 22v-5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
                              <path d="M2 13v-2a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2" />
                              <path d="M2 4v2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                            </svg>
                            <Label className="text-base font-medium">Departamente</Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Activează această opțiune pentru a putea organiza echipa pe departamente.
                            Când este activată, secțiunea de Departamente va fi disponibilă în meniul principal.
                          </p>
                        </div>
                        <div className="ml-auto flex items-center space-x-2">
                          <Label htmlFor="has-departments" className="sr-only">
                            Activează departamente
                          </Label>
                          <Switch 
                            id="has-departments"
                            checked={hasDepartments}
                            onCheckedChange={(checked) => {
                              setHasDepartments(checked);
                              // Apelul către API pentru a actualiza structura
                              fetch('/api/organization/structure', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ has_departments: checked }),
                              }).then(res => {
                                if (res.ok) {
                                  // Notificare de succes
                                  toast({
                                    title: "Setări actualizate",
                                    description: checked 
                                      ? "Departamentele au fost activate cu succes." 
                                      : "Departamentele au fost dezactivate.",
                                  });
                                  // Reîncarcă datele organizației
                                  queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
                                } else {
                                  // Revenim la starea anterioară în caz de eroare
                                  setHasDepartments(!checked);
                                  toast({
                                    title: "Eroare",
                                    description: "Nu s-a putut actualiza structura organizației",
                                    variant: "destructive",
                                  });
                                }
                              }).catch(error => {
                                // Revenim la starea anterioară în caz de eroare
                                setHasDepartments(!checked);
                                toast({
                                  title: "Eroare",
                                  description: "Nu s-a putut actualiza structura organizației",
                                  variant: "destructive",
                                });
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Card explicativ */}
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-5 w-5 text-muted-foreground"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      <CardTitle className="text-base font-medium">Despre structura organizațională</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Funcționalitățile de structură organizațională vă permit să gestionați mai eficient echipa și proiectele:
                      </p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mt-0.5 h-5 w-5 text-primary"
                          >
                            <path d="M2 22v-5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
                            <path d="M2 13v-2a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2" />
                            <path d="M2 4v2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium">Departamente</h4>
                            <p className="text-xs text-muted-foreground">
                              Grupează membri echipei în departamente funcționale, fiecare cu propriul manager și responsabilități.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mt-0.5 h-5 w-5 text-primary"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-medium">Membri echipă</h4>
                            <p className="text-xs text-muted-foreground">
                              Indiferent de setarea departamentelor, membrii echipei pot fi gestionați în secțiunea dedicată.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Setări notificări</CardTitle>
                <CardDescription>
                  Controlează cum primești alerte și notificări
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  <p>Funcționalitate în dezvoltare</p>
                  <p>Această secțiune va permite configurarea preferințelor pentru notificările pe email, în aplicație și push.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Securitate și autentificare</CardTitle>
                <CardDescription>
                  Gestionează setările de securitate pentru cont
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  <p>Funcționalitate în dezvoltare</p>
                  <p>Această secțiune va include opțiuni pentru schimbarea parolei, configurarea autentificării în doi pași și setări de acces.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}