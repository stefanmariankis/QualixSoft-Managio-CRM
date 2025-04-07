import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNotifications } from "@/hooks/use-notifications";
import { useEffect } from "react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean().default(true),
  browser_notifications: z.boolean().default(true),
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
  task_assigned: z.boolean().default(true),
  task_completed: z.boolean().default(true),
  task_deadline: z.boolean().default(true),
  comment_added: z.boolean().default(true),
  project_update: z.boolean().default(true),
  invoice_status: z.boolean().default(true),
  payment_received: z.boolean().default(true),
  team_member_added: z.boolean().default(true),
  system_alert: z.boolean().default(true),
  notification_frequency: z.enum(["real_time", "hourly", "daily", "weekly"]).default("real_time"),
});

type NotificationPreferencesForm = z.infer<typeof notificationPreferencesSchema>;

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreferences, isUpdatingPreferences } = useNotifications();

  const form = useForm<NotificationPreferencesForm>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      email_notifications: true,
      browser_notifications: true,
      quiet_hours_enabled: false,
      quiet_hours_start: "",
      quiet_hours_end: "",
      task_assigned: true,
      task_completed: true,
      task_deadline: true,
      comment_added: true,
      project_update: true,
      invoice_status: true,
      payment_received: true,
      team_member_added: true,
      system_alert: true,
      notification_frequency: "real_time",
    },
  });

  useEffect(() => {
    if (preferences) {
      form.reset({
        email_notifications: preferences.email_notifications,
        browser_notifications: preferences.browser_notifications,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start || "",
        quiet_hours_end: preferences.quiet_hours_end || "",
        task_assigned: preferences.task_assigned,
        task_completed: preferences.task_completed,
        task_deadline: preferences.task_deadline,
        comment_added: preferences.comment_added,
        project_update: preferences.project_update,
        invoice_status: preferences.invoice_status,
        payment_received: preferences.payment_received,
        team_member_added: preferences.team_member_added,
        system_alert: preferences.system_alert,
        notification_frequency: preferences.notification_frequency,
      });
    }
  }, [preferences, form]);

  const onSubmit = (data: NotificationPreferencesForm) => {
    updatePreferences(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Canale de notificare</h3>
            <p className="text-sm text-muted-foreground">
              Alegeți cum doriți să primiți notificări din aplicație.
            </p>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="browser_notifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between border p-4 rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notificări browser</FormLabel>
                    <FormDescription>
                      Primiți notificări în browser când aplicația este deschisă
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

            <FormField
              control={form.control}
              name="email_notifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between border p-4 rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notificări email</FormLabel>
                    <FormDescription>
                      Primiți notificări prin email pentru actualizări importante
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

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Frecvență notificări</h3>
            <p className="text-sm text-muted-foreground">
              Setați cât de des doriți să primiți notificări.
            </p>
          </div>

          <FormField
            control={form.control}
            name="notification_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecvență</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectați frecvența notificărilor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="real_time">În timp real</SelectItem>
                    <SelectItem value="hourly">Orară (sumar)</SelectItem>
                    <SelectItem value="daily">Zilnică (sumar)</SelectItem>
                    <SelectItem value="weekly">Săptămânală (sumar)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Acestă setare afectează în principal notificările prin email. Notificările din browser vor fi afișate în timp real.
                </FormDescription>
              </FormItem>
            )}
          />

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Ore de liniște</h3>
            <p className="text-sm text-muted-foreground">
              Setați un interval de timp în care nu veți primi notificări.
            </p>
          </div>

          <FormField
            control={form.control}
            name="quiet_hours_enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Activați orele de liniște</FormLabel>
                  <FormDescription>
                    Nu veți primi notificări în intervalul de timp specificat
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

          {form.watch("quiet_hours_enabled") && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quiet_hours_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ora de început</FormLabel>
                    <FormControl>
                      <Input type="time" value={field.value || ""} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quiet_hours_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ora de sfârșit</FormLabel>
                    <FormControl>
                      <Input type="time" value={field.value || ""} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Tipuri de notificări</h3>
            <p className="text-sm text-muted-foreground">
              Alegeți tipurile de notificări pe care doriți să le primiți.
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="task_assigned"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sarcină asignată</FormLabel>
                          <FormDescription>
                            Când vi se asignează o sarcină nouă
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="task_completed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sarcină finalizată</FormLabel>
                          <FormDescription>
                            Când o sarcină este marcată ca finalizată
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="task_deadline"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Termenul limită se apropie</FormLabel>
                          <FormDescription>
                            Când termenul limită pentru o sarcină se apropie
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comment_added"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Comentariu adăugat</FormLabel>
                          <FormDescription>
                            Când cineva adaugă un comentariu la o sarcină
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_update"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Actualizări proiect</FormLabel>
                          <FormDescription>
                            Când apar actualizări în proiectele dvs.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoice_status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Status factură</FormLabel>
                          <FormDescription>
                            Când statusul unei facturi se schimbă
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_received"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Plată primită</FormLabel>
                          <FormDescription>
                            Când se înregistrează o plată pentru o factură
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="team_member_added"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Membru nou în echipă</FormLabel>
                          <FormDescription>
                            Când un nou membru se alătură echipei
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="system_alert"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Alerte sistem</FormLabel>
                          <FormDescription>
                            Notificări importante despre sistem și întreținere
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Button type="submit" disabled={isUpdatingPreferences}>
          {isUpdatingPreferences ? "Se salvează..." : "Salvează preferințele"}
        </Button>
      </form>
    </Form>
  );
}