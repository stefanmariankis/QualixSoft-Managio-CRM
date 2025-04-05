import React from 'react';
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
import DashboardLayout from '@/components/layout/dashboard-layout';

export default function SettingsPage() {
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
            <Card>
              <CardHeader>
                <CardTitle>Setări organizație</CardTitle>
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