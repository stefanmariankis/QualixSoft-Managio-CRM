import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Save,
  Users,
  FileText,
  Landmark,
  Mail,
  Phone,
  Globe,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  // Obține detaliile organizației
  const { data: organization, isLoading } = useQuery<any>({
    queryKey: ["/api/organization"],
  });

  // Form pentru setări generale
  const generalForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      description: "",
      logo_url: "",
    }
  });

  // Form pentru setări structură organizațională
  const structureForm = useForm({
    defaultValues: {
      has_departments: false,
    }
  });

  // Update form values when organization data is loaded
  useState(() => {
    if (organization) {
      generalForm.reset({
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        website: organization.website || "",
        address: organization.address || "",
        description: organization.description || "",
        logo_url: organization.logo_url || "",
      });
      
      structureForm.reset({
        has_departments: organization.has_departments || false,
      });
    }
  });

  // Mutație pentru actualizarea setărilor generale
  const updateGeneralSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/organization", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succes",
        description: "Setările organizației au fost actualizate cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la actualizarea setărilor",
        variant: "destructive",
      });
    },
  });

  // Mutație pentru actualizarea structurii organizaționale
  const updateStructureSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/organization/structure", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Succes",
        description: `Setările structurii organizaționale au fost actualizate. Departamentele sunt acum ${data.has_departments ? 'activate' : 'dezactivate'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la actualizarea setărilor",
        variant: "destructive",
      });
    },
  });
  
  // Handler pentru form general
  const onSubmitGeneral = (data: any) => {
    updateGeneralSettings.mutate(data);
  };

  // Handler pentru form structură
  const onSubmitStructure = (data: any) => {
    updateStructureSettings.mutate(data);
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

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Setări organizație</h1>
          <p className="text-muted-foreground">
            Gestionează setările și configurațiile organizației tale
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Generale</TabsTrigger>
            <TabsTrigger value="structure">Structură organizațională</TabsTrigger>
          </TabsList>
          
          {/* Tab: Setări generale */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informații generale</CardTitle>
                <CardDescription>
                  Informațiile de bază ale organizației tale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...generalForm}>
                  <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FormField
                        control={generalForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numele organizației</FormLabel>
                            <FormControl>
                              <Input placeholder="Numele companiei" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="contact@companie.ro" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="0712 345 678" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="www.companie.ro" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={generalForm.control}
                        name="logo_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Logo</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/logo.png" {...field} />
                            </FormControl>
                            <FormDescription>
                              URL-ul către logo-ul organizației
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={generalForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresă</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Adresa completă" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descriere</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="O scurtă descriere a organizației" 
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateGeneralSettings.isPending}
                      >
                        {updateGeneralSettings.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvează modificările
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Structură organizațională */}
          <TabsContent value="structure">
            <Card>
              <CardHeader>
                <CardTitle>Structură organizațională</CardTitle>
                <CardDescription>
                  Configurează cum este structurată organizația ta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...structureForm}>
                  <form onSubmit={structureForm.handleSubmit(onSubmitStructure)} className="space-y-6">
                    <div className="space-y-6">
                      <FormField
                        control={structureForm.control}
                        name="has_departments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center">
                                <Building2 className="mr-2 h-5 w-5 text-primary" />
                                <FormLabel className="text-base font-medium">Departamente</FormLabel>
                              </div>
                              <FormDescription className="text-sm text-muted-foreground">
                                Activează această opțiune pentru a putea organiza echipa pe departamente.
                                Când este activată, secțiunea de Departamente va fi disponibilă în meniul principal.
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
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateStructureSettings.isPending}
                      >
                        {updateStructureSettings.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvează modificările
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Card explicativ */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <div className="flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5 text-muted-foreground" />
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
                      <Building2 className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <h4 className="text-sm font-medium">Departamente</h4>
                        <p className="text-xs text-muted-foreground">
                          Grupează membri echipei în departamente funcționale, fiecare cu propriul manager și responsabilități.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-5 w-5 text-primary" />
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
      </div>
    </DashboardLayout>
  );
}