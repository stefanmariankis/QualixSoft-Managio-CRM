import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DashboardLayout from '@/components/layout/dashboard-layout';

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Template-uri</h1>
            <p className="text-muted-foreground">
              Gestionează template-uri pentru documente, facturi și contracte
            </p>
          </div>
          <Button className="flex items-center gap-1">
            <Plus size={16} />
            <span>Template nou</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template-uri</CardTitle>
            <CardDescription>
              Gestionează template-urile predefinite pentru documente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-20 text-muted-foreground">
              <p>Funcționalitate în dezvoltare</p>
              <p>Această pagină va facilita crearea și gestionarea template-urilor personalizate pentru documentația companiei.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}