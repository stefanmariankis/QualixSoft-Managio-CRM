import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationList } from "@/components/notifications/notification-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="container py-6 max-w-5xl mx-auto">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificări</h1>
            <p className="text-muted-foreground">
              Gestionați notificările și actualizările importante din platforma Managio.
            </p>
          </div>
          
          <Separator />
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Toate notificările</TabsTrigger>
              <TabsTrigger value="preferences">Preferințe</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notificări</CardTitle>
                  <CardDescription>
                    Notificările vă țin la curent cu activitatea din proiecte, sarcini și alte actualizări importante.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationList />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preferințe notificări</CardTitle>
                  <CardDescription>
                    Personalizați preferințele pentru notificări și canale de comunicare.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationPreferences />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}