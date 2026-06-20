import React, { useState, useRef } from 'react';
import { storage } from '@/src/integrations/firebase/client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Upload, X, Check, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder,
  label = 'Imagem',
  placeholder = 'Cole a URL ou suba um arquivo'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = (file: File) => {
    if (!file) return;

    // Check file size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 5MB.');
      return;
    }

    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validExtensions.includes(file.type)) {
      toast.error('Apenas arquivos de imagem PNG, JPG ou JPEG são aceitos.');
      return;
    }

    setUploading(true);
    setProgress(0);

    // Create a safe, unique filename
    const fileExtension = file.name.split('.').pop();
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const storageRef = ref(storage, `${folder}/${safeName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      },
      (error) => {
        console.error('Erro no upload Storage:', error);
        setUploading(false);
        toast.error('Erro ao fazer upload da imagem.');
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadUrl);
          setUploading(false);
          toast.success('Imagem enviada com sucesso!');
        } catch (err) {
          console.error('Erro ao pegar URL da imagem:', err);
          setUploading(false);
          toast.error('Falha ao obter URL pública do arquivo.');
        }
      }
    );
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-slate-700 font-semibold text-xs block">{label}</label>}

      {/* Main Upload Box & Drag Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 text-center relative flex flex-col items-center justify-center min-h-[140px] ${
          isDragActive
            ? 'border-ocean bg-ocean/5'
            : value
            ? 'border-emerald-200 bg-emerald-50/20'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleUploadFile(files[0]);
            }
          }}
        />

        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-ocean" />
            <span className="text-xs font-medium text-slate-500">Enviando ({progress}%)</span>
            <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-ocean h-full duration-150 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : value ? (
          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="relative group max-w-[150px] aspect-video rounded border overflow-hidden bg-slate-100 shadow-sm">
              <img
                src={value}
                alt="Upload Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/150x100?text=Erro+Carregamento';
                }}
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-90 transition-colors shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Check className="h-3.5 w-3.5" />
              Upload Concluído / URL Ativa
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-2 flex flex-col items-center">
            <div className="p-3 bg-white rounded-full shadow-sm text-slate-400">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-ocean font-semibold hover:underline"
              >
                Clique para enviar
              </button>
              <span className="text-slate-400"> ou arraste o arquivo aqui</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Formatos aceitos: PNG, JPG, JPEG (Máx 5MB)
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Coexistence URL Field */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            className="pl-9 h-9 text-xs"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        {value && (
          <Button
            type="button"
            variant="outline"
            className="h-9 px-2 text-slate-400 hover:text-red-500"
            onClick={() => onChange('')}
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
