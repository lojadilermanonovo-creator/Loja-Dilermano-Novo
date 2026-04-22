import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImageManagerProps {
  images: { url: string }[];
  onChange: (images: { url: string }[]) => void;
}

export default function ProductImageManager({ images, onChange }: ProductImageManagerProps) {
  const [newUrl, setNewUrl] = useState('');

  const addImage = () => {
    if (!newUrl) return;
    if (images.length >= 3) {
      toast.error('Máximo de 3 imagens por produto');
      return;
    }
    onChange([...images, { url: newUrl }]);
    setNewUrl('');
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold uppercase tracking-wider">Imagens do Produto (Máx 3)</label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border bg-muted">
            <img src={img.url} className="h-full w-full object-cover" alt="Preview" />
            <button 
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-sunset transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {images.length < 3 && (
          <div className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20">
            <ImageIcon className="h-8 w-8 opacity-20" />
            <span className="text-[10px] uppercase font-bold tracking-tighter">Espaço Livre</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Cole a URL da imagem aqui..." 
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
          className="rounded-xl"
        />
        <Button 
          type="button" 
          variant="secondary" 
          className="rounded-xl font-bold px-6"
          onClick={addImage}
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
    </div>
  );
}
