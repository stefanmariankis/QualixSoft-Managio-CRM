import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, FileText, Download, Copy, Edit, MoreHorizontal, File, PlusCircle, Eye } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Tipurile de date pentru template-uri
interface Template {
  id: number;
  name: string;
  description: string;
  category: 'oferte' | 'contracte' | 'facturi' | 'rapoarte' | 'altele';
  tags: string[];
  isPredefined: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  previewImageUrl?: string;
}

const TEMPLATE_CATEGORIES = [
  { id: 'oferte', name: 'Oferte', color: 'bg-blue-100 text-blue-800' },
  { id: 'contracte', name: 'Contracte', color: 'bg-purple-100 text-purple-800' },
  { id: 'facturi', name: 'Facturi', color: 'bg-green-100 text-green-800' },
  { id: 'rapoarte', name: 'Rapoarte', color: 'bg-orange-100 text-orange-800' },
  { id: 'altele', name: 'Altele', color: 'bg-gray-100 text-gray-800' },
];

// Template-uri predefinite
const PREDEFINED_TEMPLATES: Template[] = [
  {
    id: 1,
    name: 'Ofertă standard servicii',
    description: 'Template standard pentru oferte de servicii cu detalii despre preț, termeni și condiții, și perioada de valabilitate.',
    category: 'oferte',
    tags: ['servicii', 'standard', 'profesional'],
    isPredefined: true,
    createdAt: new Date(2023, 0, 15),
    updatedAt: new Date(2023, 0, 15),
    previewImageUrl: '/templates/offer-template-preview.png',
  },
  {
    id: 2,
    name: 'Contract prestări servicii',
    description: 'Contract de prestări servicii conform legislației române, cu clauze standard și termeni de plată.',
    category: 'contracte',
    tags: ['servicii', 'legal', 'standard'],
    isPredefined: true,
    createdAt: new Date(2023, 0, 16),
    updatedAt: new Date(2023, 1, 10),
    previewImageUrl: '/templates/contract-template-preview.png',
  },
  {
    id: 3,
    name: 'Factură fiscală',
    description: 'Template factură fiscală conform normelor ANAF, cu toate câmpurile obligatorii și calcul automat TVA.',
    category: 'facturi',
    tags: ['fiscal', 'TVA', 'ANAF'],
    isPredefined: true,
    createdAt: new Date(2023, 0, 17),
    updatedAt: new Date(2023, 0, 17),
    previewImageUrl: '/templates/invoice-template-preview.png',
  },
  {
    id: 4,
    name: 'Contract de confidențialitate (NDA)',
    description: 'Contract de confidențialitate pentru protejarea informațiilor sensibile partajate între părți.',
    category: 'contracte',
    tags: ['confidențialitate', 'legal', 'protecție'],
    isPredefined: true,
    createdAt: new Date(2023, 0, 20),
    updatedAt: new Date(2023, 0, 20),
    previewImageUrl: '/templates/nda-template-preview.png',
  },
  {
    id: 5,
    name: 'Raport lunar progres',
    description: 'Template pentru raportul lunar de progres cu metrici cheie și status pentru proiecte în derulare.',
    category: 'rapoarte',
    tags: ['progres', 'lunar', 'metrici'],
    isPredefined: true,
    createdAt: new Date(2023, 0, 25),
    updatedAt: new Date(2023, 0, 25),
    previewImageUrl: '/templates/report-template-preview.png',
  },
  {
    id: 6,
    name: 'Ofertă detaliată proiect',
    description: 'Template ofertă detaliată pentru proiecte complexe, cu defalcare pe etape, livrabile și costuri.',
    category: 'oferte',
    tags: ['proiect', 'detaliat', 'etape'],
    isPredefined: true,
    createdAt: new Date(2023, 1, 5),
    updatedAt: new Date(2023, 1, 5),
    previewImageUrl: '/templates/detailed-offer-preview.png',
  },
  {
    id: 7,
    name: 'Factură proformă',
    description: 'Template pentru facturi proformă cu termeni de plată și instrucțiuni pentru client.',
    category: 'facturi',
    tags: ['proformă', 'avans', 'plată'],
    isPredefined: true,
    createdAt: new Date(2023, 1, 10),
    updatedAt: new Date(2023, 1, 10),
    previewImageUrl: '/templates/proforma-template-preview.png',
  },
  {
    id: 8,
    name: 'Contract de mentenanță',
    description: 'Contract pentru servicii de mentenanță continuă, cu SLA și termeni de suport.',
    category: 'contracte',
    tags: ['mentenanță', 'suport', 'SLA'],
    isPredefined: true,
    createdAt: new Date(2023, 1, 15),
    updatedAt: new Date(2023, 1, 15),
    previewImageUrl: '/templates/maintenance-contract-preview.png',
  },
  {
    id: 9,
    name: 'Raport financiar',
    description: 'Template pentru rapoarte financiare cu venituri, cheltuieli și profitabilitate pe proiecte și clienți.',
    category: 'rapoarte',
    tags: ['financiar', 'profit', 'analiza'],
    isPredefined: true,
    createdAt: new Date(2023, 1, 20),
    updatedAt: new Date(2023, 1, 20),
    previewImageUrl: '/templates/financial-report-preview.png',
  },
  {
    id: 10,
    name: 'Scrisoare de recomandare',
    description: 'Template pentru scrisori de recomandare pentru clienți sau colaboratori.',
    category: 'altele',
    tags: ['recomandare', 'referință', 'professional'],
    isPredefined: true,
    createdAt: new Date(2023, 1, 25),
    updatedAt: new Date(2023, 1, 25),
    previewImageUrl: '/templates/recommendation-letter-preview.png',
  },
];

// Template-uri personalizate (ar fi salvate în baza de date în aplicația reală)
const CUSTOM_TEMPLATES: Template[] = [
  {
    id: 101,
    name: 'Ofertă website e-commerce',
    description: 'Ofertă personalizată pentru dezvoltarea unui website e-commerce cu funcționalități specifice.',
    category: 'oferte',
    tags: ['website', 'e-commerce', 'personalizat'],
    isPredefined: false,
    lastUsed: new Date(2023, 2, 5),
    createdAt: new Date(2023, 2, 1),
    updatedAt: new Date(2023, 2, 5),
  },
  {
    id: 102,
    name: 'Contract dezvoltare aplicație',
    description: 'Contract personalizat pentru dezvoltarea unei aplicații mobile cu termeni specifici.',
    category: 'contracte',
    tags: ['aplicație', 'mobile', 'dezvoltare'],
    isPredefined: false,
    lastUsed: new Date(2023, 2, 10),
    createdAt: new Date(2023, 2, 7),
    updatedAt: new Date(2023, 2, 10),
  },
];

// Combinăm toate template-urile
const ALL_TEMPLATES = [...PREDEFINED_TEMPLATES, ...CUSTOM_TEMPLATES];

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewTemplateDialogOpen, setViewTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const { toast } = useToast();

  // Filtrăm template-urile
  const filteredTemplates = ALL_TEMPLATES.filter(template => {
    // Filtrare după tab
    if (activeTab !== 'all' && template.category !== activeTab) {
      return false;
    }
    
    // Filtrare după termen de căutare
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Obține numele pentru o categorie
  const getCategoryName = (categoryId: string) => {
    const category = TEMPLATE_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Obține culoarea pentru o categorie
  const getCategoryColor = (categoryId: string) => {
    const category = TEMPLATE_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  // Formatează data pentru afișare
  const formatDate = (date: Date) => {
    return format(date, 'd MMM yyyy', { locale: ro });
  };

  // Deschide dialogul de previzualizare template
  const openViewTemplateDialog = (template: Template) => {
    setSelectedTemplate(template);
    setViewTemplateDialogOpen(true);
  };

  // Handler pentru descărcarea unui template
  const handleDownloadTemplate = (template: Template) => {
    toast({
      title: 'Descărcare template',
      description: `Template-ul "${template.name}" a fost descărcat cu succes.`,
    });
  };

  // Handler pentru duplicarea unui template
  const handleDuplicateTemplate = (template: Template) => {
    toast({
      title: 'Template duplicat',
      description: `Template-ul "${template.name}" a fost duplicat. Puteți găsi copia în lista de template-uri personalizate.`,
    });
  };

  // Handler pentru folosirea unui template
  const handleUseTemplate = (template: Template) => {
    toast({
      title: 'Template selectat',
      description: `Template-ul "${template.name}" a fost selectat pentru utilizare.`,
    });
  };

  // Render card pentru un template
  const renderTemplateCard = (template: Template) => (
    <Card key={template.id} className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={`${getCategoryColor(template.category)}`}>
            {getCategoryName(template.category)}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acțiuni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openViewTemplateDialog(template)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Previzualizare</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                <File className="mr-2 h-4 w-4" />
                <span>Utilizează</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Duplică</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadTemplate(template)}>
                <Download className="mr-2 h-4 w-4" />
                <span>Descarcă</span>
              </DropdownMenuItem>
              {!template.isPredefined && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Editează</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CardTitle className="text-lg mt-2 cursor-pointer hover:text-primary" onClick={() => openViewTemplateDialog(template)}>
          {template.name}
        </CardTitle>
        
        <CardDescription>
          {template.isPredefined ? 'Template predefinit' : 'Template personalizat'}
          {template.lastUsed && ` • Folosit ultima dată: ${formatDate(template.lastUsed)}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{template.description}</p>
        
        <div className="flex flex-wrap gap-1 mt-auto">
          {template.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between border-t">
        <div className="text-xs text-muted-foreground">
          Creat: {formatDate(template.createdAt)}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => handleUseTemplate(template)}
        >
          Utilizează
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Template-uri</h1>
          
          <div className="flex gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Caută template-uri..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adaugă Template
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="all">Toate</TabsTrigger>
            {TEMPLATE_CATEGORIES.map(category => (
              <TabsTrigger key={category.id} value={category.id}>{category.name}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-6">
            {/* Secțiunea de template-uri predefinite (dacă sunt filtrate) */}
            {activeTab === 'all' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Template-uri predefinite</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates
                    .filter(template => template.isPredefined)
                    .map(renderTemplateCard)}
                </div>
              </div>
            )}
            
            {/* Secțiunea de template-uri personalizate (dacă sunt filtrate) */}
            {activeTab === 'all' && filteredTemplates.some(template => !template.isPredefined) && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Template-uri personalizate</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates
                    .filter(template => !template.isPredefined)
                    .map(renderTemplateCard)}
                </div>
              </div>
            )}
            
            {/* Când este selectată o categorie specifică */}
            {activeTab !== 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(renderTemplateCard)}
              </div>
            )}
            
            {/* Când nu există rezultate */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Niciun template găsit</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm 
                    ? `Nu am găsit niciun template care să corespundă căutării "${searchTerm}".` 
                    : 'Nu există template-uri în această categorie.'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Dialog de previzualizare template */}
        <Dialog open={viewTemplateDialogOpen} onOpenChange={setViewTemplateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                {selectedTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="text-sm font-medium mb-2">Detalii template</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categorie:</span>
                    <Badge className={`${selectedTemplate && getCategoryColor(selectedTemplate.category)}`}>
                      {selectedTemplate && getCategoryName(selectedTemplate.category)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip:</span>
                    <span>{selectedTemplate?.isPredefined ? 'Predefinit' : 'Personalizat'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creat la:</span>
                    <span>{selectedTemplate && formatDate(selectedTemplate.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actualizat la:</span>
                    <span>{selectedTemplate && formatDate(selectedTemplate.updatedAt)}</span>
                  </div>
                  {selectedTemplate?.lastUsed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Folosit ultima dată:</span>
                      <span>{formatDate(selectedTemplate.lastUsed)}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-sm font-medium mt-4 mb-2">Etichete</div>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate?.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex-[2]">
                <div className="text-sm font-medium mb-2">Previzualizare</div>
                <div className="border rounded-md overflow-hidden">
                  {selectedTemplate?.previewImageUrl ? (
                    <img 
                      src={selectedTemplate.previewImageUrl} 
                      alt={`Preview for ${selectedTemplate.name}`}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-muted">
                      <p className="text-muted-foreground">Previzualizare indisponibilă</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadTemplate(selectedTemplate!)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descarcă
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDuplicateTemplate(selectedTemplate!)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplică
                </Button>
              </div>
              
              <Button 
                onClick={() => {
                  handleUseTemplate(selectedTemplate!);
                  setViewTemplateDialogOpen(false);
                }}
              >
                Utilizează Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}