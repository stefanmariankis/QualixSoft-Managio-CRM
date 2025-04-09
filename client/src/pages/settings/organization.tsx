import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { OrganizationType, SubscriptionPlan } from "@/types/common.types";
import { UpdateOrganization, UpdateOrganizationSettings } from "@/types/organization.types";

// Definim schema de validare pentru formular
const organizationFormSchema = z.object({
  name: z.string().min(3, { message: "Numele organizației trebuie să aibă minim 3 caractere" }),
  slug: z.string().min(3, { message: "Slug-ul trebuie să aibă minim 3 caractere" })
    .regex(/^[a-z0-9-]+$/, { 
      message: "Slug-ul poate conține doar litere mici, cifre și cratime" 
    }),
  organization_type: z.nativeEnum(OrganizationType),
  has_departments: z.boolean().default(false),
});

const settingsFormSchema = z.object({
  default_currency: z.string().min(1, { message: "Selectați o monedă" }),
  default_language: z.string().min(1, { message: "Selectați o limbă" }),
  date_format: z.string().min(1, { message: "Selectați un format de dată" }),
  time_format: z.string().min(1, { message: "Selectați un format de timp" }),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Culoarea trebuie să fie în format hex (ex: #FF5500)"
  }).optional(),
});

// Componenta pentru setările organizației
export default function OrganizationSettings() {
  const { organization, updateOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  // Formularul pentru setări generale
  const generalForm = useForm<z.infer<typeof organizationFormSchema>>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization?.name || "",
      slug: organization?.slug || "",
      organization_type: organization?.organization_type || OrganizationType.INDIVIDUAL,
      has_departments: organization?.has_departments || false,
    },
  });

  // Formularul pentru preferințe
  const preferencesForm = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      default_currency: "RON",
      default_language: "ro",
      date_format: "DD.MM.YYYY",
      time_format: "HH:mm",
      primary_color: "#FF8C00",
    },
  });

  // Handler pentru actualizarea setărilor generale
  const onGeneralSubmit = (data: z.infer<typeof organizationFormSchema>) => {
    if (!organization) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu există o organizație pentru a actualiza setările",
      });
      return;
    }

    try {
      // Actualizăm organizația în context (și implicit în localStorage)
      updateOrganization(data as UpdateOrganization);
      
      toast({
        title: "Succes",
        description: "Setările organizației au fost actualizate",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-au putut actualiza setările organizației",
      });
    }
  };

  // Handler pentru actualizarea preferințelor
  const onPreferencesSubmit = (data: z.infer<typeof settingsFormSchema>) => {
    if (!organization) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu există o organizație pentru a actualiza setările",
      });
      return;
    }

    try {
      // Actualizăm setările (în producție, ar trebui să avem un endpoint pentru asta)
      // Deocamdată doar afișăm un toast de succes
      console.log("Updating organization settings:", data);
      
      toast({
        title: "Succes",
        description: "Preferințele au fost actualizate",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-au putut actualiza preferințele",
      });
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Nicio organizație disponibilă</CardTitle>
            <CardDescription>
              Nu există o organizație asociată cu contul tău.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Setări Organizație</h1>
        <p className="text-muted-foreground">
          Gestionează setările organizației tale
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">Generale</TabsTrigger>
          <TabsTrigger value="preferences">Preferințe</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="subscription">Abonament</TabsTrigger>
        </TabsList>

        {/* Setări Generale */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Setări Generale</CardTitle>
              <CardDescription>
                Informații de bază despre organizația ta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nume Organizație</FormLabel>
                        <FormControl>
                          <Input placeholder="Numele organizației" {...field} />
                        </FormControl>
                        <FormDescription>
                          Numele afișat al organizației tale.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="slug-organizatie" {...field} />
                        </FormControl>
                        <FormDescription>
                          Identificatorul URL al organizației tale.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="organization_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tip Organizație</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează tipul organizației" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={OrganizationType.INDIVIDUAL}>Freelancer</SelectItem>
                            <SelectItem value={OrganizationType.AGENCY}>Agenție</SelectItem>
                            <SelectItem value={OrganizationType.COMPANY}>Companie</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Tipul organizației determină anumite funcționalități disponibile.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generalForm.control}
                    name="has_departments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Departamente</FormLabel>
                          <FormDescription>
                            Activează structura organizațională pe departamente.
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

                  <Button type="submit">Salvează Setările</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferințe */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferințe</CardTitle>
              <CardDescription>
                Setează preferințele implicite pentru organizația ta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={preferencesForm.control}
                      name="default_currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monedă Implicită</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează moneda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RON">RON (Leu românesc)</SelectItem>
                              <SelectItem value="EUR">EUR (Euro)</SelectItem>
                              <SelectItem value="USD">USD (Dolar american)</SelectItem>
                              <SelectItem value="GBP">GBP (Liră sterlină)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={preferencesForm.control}
                      name="default_language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limbă Implicită</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează limba" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ro">Română</SelectItem>
                              <SelectItem value="en">Engleză</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={preferencesForm.control}
                      name="date_format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format Dată</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează formatul datei" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (31.12.2023)</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={preferencesForm.control}
                      name="time_format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format Timp</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selectează formatul timpului" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="HH:mm">24 ore (14:30)</SelectItem>
                              <SelectItem value="hh:mm A">12 ore (02:30 PM)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={preferencesForm.control}
                    name="primary_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Culoare Primară</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="#FF5500"
                              {...field}
                            />
                          </FormControl>
                          <div 
                            className="w-10 h-10 rounded-full border" 
                            style={{ backgroundColor: field.value || '#FF8C00' }}
                          />
                        </div>
                        <FormDescription>
                          Culoarea principală a interfeței (format hex, ex: #FF5500)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Salvează Preferințele</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurare Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configurare Email</CardTitle>
              <CardDescription>
                Configurează setările pentru trimiterea de email-uri din aplicație
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="smtp_host">Server SMTP</Label>
                  <Input id="smtp_host" placeholder="smtp.example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_port">Port</Label>
                    <Input id="smtp_port" placeholder="587" type="number" />
                  </div>
                  <div className="flex items-center gap-2 mt-8">
                    <Switch id="ssl" defaultChecked />
                    <Label htmlFor="ssl">Folosește SSL/TLS</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtp_username">Utilizator SMTP</Label>
                  <Input id="smtp_username" placeholder="user@example.com" />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Parolă SMTP</Label>
                  <Input id="smtp_password" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label htmlFor="email_from">Adresă Expeditor</Label>
                  <Input id="email_from" placeholder="noreply@compania-ta.ro" />
                </div>
                <Button>Testează Conexiunea</Button>
                <Button className="ml-2">Salvează Configurația</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abonament */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Informații Abonament</CardTitle>
              <CardDescription>
                Detalii despre abonamentul actual și istoricul plăților
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Plan Curent</h3>
                    <p className="text-xl font-bold">
                      {organization.subscription_plan === SubscriptionPlan.FREE && "Gratuit"}
                      {organization.subscription_plan === SubscriptionPlan.BASIC && "Basic"}
                      {organization.subscription_plan === SubscriptionPlan.PRO && "Professional"}
                      {organization.subscription_plan === SubscriptionPlan.ENTERPRISE && "Enterprise"}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Stare</h3>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${organization.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <p className="text-lg font-semibold">{organization.is_active ? 'Activ' : 'Inactiv'}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Detalii Abonament</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Început:</span>
                      <span className="font-medium">{organization.subscription_started_at ? new Date(organization.subscription_started_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expiră:</span>
                      <span className="font-medium">{organization.subscription_expires_at ? new Date(organization.subscription_expires_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Perioadă de probă:</span>
                      <span className="font-medium">{organization.trial_expires_at ? new Date(organization.trial_expires_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Istoricul Plăților</Button>
                  <Button>Schimbă Planul</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}