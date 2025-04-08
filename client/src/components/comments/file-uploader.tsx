import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, File, Image } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // în MB
  allowedTypes?: string[];
  className?: string;
}

export default function FileUploader({
  onFileUpload,
  maxFiles = 5,
  maxSize = 10, // MB
  allowedTypes = ['image/*', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  className = '',
}: FileUploaderProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    // Verifică numărul maxim de fișiere
    if (selectedFiles.length + files.length > maxFiles) {
      toast({
        title: 'Prea multe fișiere',
        description: `Poți încărca maximum ${maxFiles} fișiere.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Verifică mărimea și tipul fișierelor
    const validFiles: File[] = [];
    const maxSizeBytes = maxSize * 1024 * 1024; // MB to bytes
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Verifică mărimea
      if (file.size > maxSizeBytes) {
        toast({
          title: 'Fișier prea mare',
          description: `Fișierul "${file.name}" depășește limita de ${maxSize}MB.`,
          variant: 'destructive',
        });
        continue;
      }
      
      // Verifică tipul
      const isAllowedType = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          const mainType = type.split('/')[0];
          return file.type.startsWith(mainType + '/');
        }
        return file.type === type;
      });
      
      if (!isAllowedType) {
        toast({
          title: 'Tip de fișier nepermis',
          description: `Fișierul "${file.name}" are un format nepermis.`,
          variant: 'destructive',
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      // Simulăm încărcarea fișierelor (pentru demonstrație)
      setUploadProgress(0);
      const timer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 100) {
            clearInterval(timer);
            
            // Adăugăm fișierele valide la lista existentă
            setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
            onFileUpload([...selectedFiles, ...validFiles]);
            
            // Resetăm progresul după completare
            setTimeout(() => setUploadProgress(null), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
    
    // Resetăm input-ul pentru a permite reîncărcarea aceluiași fișier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      onFileUpload(newFiles);
      return newFiles;
    });
  };

  const renderFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 mr-2" />;
    }
    return <File className="h-4 w-4 mr-2" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className={`text-gray-500 ${className}`}
          title="Adaugă fișier atașat"
        >
          <Paperclip className="h-4 w-4 mr-1" />
          <span>Atașament</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="text-sm font-medium">
            Adaugă fișiere atașate
          </div>
          
          <div className="space-y-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Selectează fișiere
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept={allowedTypes.join(',')}
            />
            
            <div className="text-xs text-gray-500">
              Maximum {maxFiles} fișiere, {maxSize}MB per fișier.<br />
              Formate acceptate: imagini, PDF, documente text.
            </div>
          </div>
          
          {uploadProgress !== null && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <div className="text-xs text-gray-500 text-right">
                Se încarcă: {uploadProgress}%
              </div>
            </div>
          )}
          
          {selectedFiles.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="text-xs font-medium bg-gray-100 p-2">
                Fișiere atașate ({selectedFiles.length})
              </div>
              <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 p-1 rounded-sm text-xs"
                  >
                    <div className="flex items-center overflow-hidden">
                      {renderFileIcon(file)}
                      <span className="truncate max-w-[180px]" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}