import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Image as ImageIcon, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImageManagerProps {
  images: { url: string }[];
  onChange: (images: { url: string }[]) => void;
}

export default function ProductImageManager({ images, onChange }: ProductImageManagerProps) {
  const [newUrl, setNewUrl] = useState('');

  const addImage = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    if (images.length >= 3) {
      toast.error('Máximo de 3 imagens por produto');
      return;
    }
    onChange([...images, { url: trimmed }]);
    setNewUrl('');
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected); // place at start
    onChange(newImages);
    toast.success('Imagem principal atualizada!');
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    onChange(newImages);
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Imagens do Produto (Máx 3)</label>
        <span className="text-xs text-slate-400 font-medium">{images.length}/3 imagens adicionadas</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div key={i} className={`relative aspect-square rounded-xl overflow-hidden border bg-white flex flex-col group transition-all ${i === 0 ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
            <img src={img.url} className="h-full w-full object-cover flex-1" alt="Preview" referrerPolicy="no-referrer" />
            
            {/* Top Right Controls */}
            <button 
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 h-7 w-7 rounded-xl bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
              title="Excluir Imagem"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Visual Indicators & Action Panel */}
            <div className="p-2 bg-slate-900/90 text-white flex items-center justify-between gap-1 text-[10px] h-10 shrink-0">
              <div className="flex items-center gap-1 font-semibold">
                {i === 0 ? (
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> Principal
                  </span>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setAsMain(i)} 
                    className="text-slate-300 hover:text-white font-bold tracking-tight cursor-pointer"
                  >
                    Tornar Principal
                  </button>
                )}
              </div>
              
              {/* Order controllers */}
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveImage(i, 'left')}
                  className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Mover para esquerda"
                >
                  <ArrowLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={i === images.length - 1}
                  onClick={() => moveImage(i, 'right')}
                  className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  title="Mover para direita"
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {images.length < 3 && (
          <div className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 bg-white">
            <ImageIcon className="h-8 w-8 opacity-35" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Espaço Livre</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Cole a URL da imagem (ex: https://images.unsplash.com/...)" 
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
          className="rounded-xl bg-white border-slate-200"
          disabled={images.length >= 3}
        />
        <Button 
          type="button" 
          variant="secondary" 
          className="rounded-xl font-bold px-6 border hover:bg-slate-100 shrink-0 h-11"
          onClick={addImage}
          disabled={images.length >= 3}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>
    </div>
  );
}
