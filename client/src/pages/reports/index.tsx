import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapoarte</h1>
            <p className="text-muted-foreground">
              Analizează performanța cu rapoarte detaliate
            </p>
          </div>
          <Button className="flex items-center gap-1">
            <Download size={16} />
            <span>Exportă raport</span>
          </Button>
        </div>
        
        <Tabs defaultValue="financial" className="mb-6">
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="financial">Financiar</TabsTrigger>
            <TabsTrigger value="projects">Proiecte</TabsTrigger>
            <TabsTrigger value="clients">Clienți</TabsTrigger>
            <TabsTrigger value="team">Echipă</TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Raport financiar</CardTitle>
                <CardDescription>
                  Analizează datele financiare ale organizației
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  <p>Funcționalitate în dezvoltare</p>
                  <p>Această secțiune va include rapoarte financiare detaliate, grafice cu venituri și cheltuieli, trenduri de facturare și analiza profitabilității.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Raport proiecte</CardTitle>
                <CardDescription>
                  Analizează performanța proiectelor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  <p>Funcționalitate în dezvoltare</p>
                  <p>Această secțiune va include rapoarte de progres pentru proiecte, statistici de eficiență, utilizarea resurselor și performanța comparativă.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Raport clienți</CardTitle>
                <CardDescription>
                  Analizează relațiile cu clienții
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  <p>Funcționalitate în dezvoltare</p>
                  <p>Această secțiune va include rapoarte despre retenția clienților, valoarea pe durata de viață, rata de conversie și satisfacția clienților.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Raport echipă</CardTitle>
                <CardDescription>
                  Analizează performanța echipei
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-20 text-muted-foreground">
                  <p>Funcționalitate în dezvoltare</p>
                  <p>Această secțiune va include rapoarte despre productivitatea echipei, alocarea sarcinilor, timpul facturat și nefacturat și performanța individuală.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}