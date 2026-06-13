import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/src/integrations/firebase/client';
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ProductImageManager from './ProductImageManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderTree, Layers, Palette, Eye, Sparkles, Check, Trash } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  price: z.coerce.number().min(0.01, 'Preço deve ser maior que zero'),
  originalPrice: z.coerce.number().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  stockQuantity: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSuccess: () => void;
}

const AVAILABLE_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
const AVAILABLE_COLORS = [
  { name: 'Preto', colorCode: '#000000', labelColor: 'bg-black text-white' },
  { name: 'Branco', colorCode: '#ffffff', labelColor: 'bg-white text-slate-800 border border-slate-300' },
  { name: 'Azul', colorCode: '#3b82f6', labelColor: 'bg-blue-600 text-white' },
  { name: 'Vermelho', colorCode: '#ef4444', labelColor: 'bg-red-600 text-white' },
  { name: 'Verde', colorCode: '#10b981', labelColor: 'bg-emerald-600 text-white' },
  { name: 'Amarelo', colorCode: '#eab308', labelColor: 'bg-amber-400 text-slate-900' },
  { name: 'Rosa', colorCode: '#ec4899', labelColor: 'bg-pink-500 text-white' },
  { name: 'Cinza', colorCode: '#6b7280', labelColor: 'bg-gray-500 text-white' },
  { name: 'Marrom', colorCode: '#78350f', labelColor: 'bg-amber-900 text-white' },
  { name: 'Bege', colorCode: '#f5f5dc', labelColor: 'bg-[#f5f5dc] text-amber-900 border border-amber-200' },
];

export default function ProductFormDialog({ open, onOpenChange, product, onSuccess }: ProductFormDialogProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Variations Selection State
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [variations, setVariations] = useState<any[]>([]);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      originalPrice: 0,
      sku: '',
      description: '',
      categoryId: '',
      stockQuantity: 0,
      isActive: true,
      isFeatured: false,
      isNew: false,
    }
  });

  // Fetch unique categories (preventing duplicate categories in the catalog selector list)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        // Deduplicate locally by name to be ultra safe against triple uploads
        const seenNames = new Set();
        const uniqueList: any[] = [];
        list.forEach(item => {
          const norm = item.name?.trim().toLowerCase();
          if (norm && !seenNames.has(norm)) {
            seenNames.add(norm);
            uniqueList.push(item);
          }
        });
        setCategories(uniqueList);
      } catch (err) {
        console.error("Error loading categories", err);
      }
    };
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Load product initial data
  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name || '',
        price: product.price || 0,
        originalPrice: product.originalPrice || 0,
        sku: product.sku || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        stockQuantity: product.stockQuantity || 0,
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
      });
      setImages(product.images || []);
      setSelectedSizes(product.selectedSizes || []);
      setSelectedColors(product.selectedColors || []);
      setVariations(product.variations || []);
    } else if (open) {
      form.reset({
        name: '', price: 0, originalPrice: 0, sku: '', description: '', 
        categoryId: '', stockQuantity: 0, isActive: true, isFeatured: false, isNew: false
      });
      setImages([]);
      setSelectedSizes([]);
      setSelectedColors([]);
      setVariations([]);
    }
  }, [product, form, open]);

  // Handle auto-generation of permutations of size + color
  const regenerateVariations = (sizes: string[], colors: string[]) => {
    const nextVariations: any[] = [];
    
    colors.forEach(col => {
      sizes.forEach(sz => {
        // Look for matching variation in active states to keep custom settings
        const match = variations.find(v => v.color === col && v.size === sz);
        if (match) {
          nextVariations.push(match);
        } else {
          // Fallback settings
          const suggestedSKU = `${form.getValues('sku') || ''}-${col.substring(0,3).toUpperCase()}-${sz}`.replace(/\s+/g, '');
          nextVariations.push({
            color: col,
            size: sz,
            price: form.getValues('price') || 0,
            stockQuantity: 0,
            sku: suggestedSKU
          });
        }
      });
    });

    setVariations(nextVariations);
  };

  const handleSizeToggle = (sz: string) => {
    const next = selectedSizes.includes(sz) 
      ? selectedSizes.filter(s => s !== sz) 
      : [...selectedSizes, sz];
    setSelectedSizes(next);
    regenerateVariations(next, selectedColors);
  };

  const handleColorToggle = (col: string) => {
    const next = selectedColors.includes(col) 
      ? selectedColors.filter(c => c !== col) 
      : [...selectedColors, col];
    setSelectedColors(next);
    regenerateVariations(selectedSizes, next);
  };

  // If there are variations, calculate general inventory sum and set stockQuantity automatically
  useEffect(() => {
    if (variations.length > 0) {
      const totalStock = variations.reduce((sum, item) => sum + (Number(item.stockQuantity) || 0), 0);
      form.setValue('stockQuantity', totalStock);
    }
  }, [variations, form]);

  const selectedCategoryId = form.watch('categoryId');
  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const currentAvailableSizes = (activeCategory?.allowedSizes && activeCategory.allowedSizes.length > 0)
    ? activeCategory.allowedSizes
    : AVAILABLE_SIZES;

  const handleVariationFieldChange = (index: number, field: string, val: any) => {
    setVariations(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: val
      };
      return next;
    });
  };

  // Submit flow
  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const productPayload = {
        ...values,
        images,
        selectedSizes,
        selectedColors,
        variations,
        updatedAt: serverTimestamp(),
      };

      if (product) {
        await updateDoc(doc(db, 'products', product.id), productPayload);
        toast.success('Produto atualizado com sucesso no catálogo!');
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, {
          ...productPayload,
          createdAt: serverTimestamp(),
        });
        toast.success('Produto criado com sucesso no catálogo!');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save product:", error);
      toast.error('Erro ao salvar produto!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl md:rounded-[2rem] bg-white text-slate-900 border border-slate-200">
        
        {/* Fixed Header */}
        <DialogHeader className="p-6 border-b border-slate-100 bg-white shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-950 flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            {product ? 'Editar Produto' : 'Novo Produto da Loja'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Preencha todos os campos necessários para configurar seu produto e as variações correspondentes.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            
            {/* Visual Section: Images Manager */}
            <ProductImageManager images={images} onChange={setImages} />

            {/* Part 1: General Info */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Informações Gerais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Nome do Produto</Label>
                  <Input id="name" {...form.register('name')} placeholder="Ex: Camiseta Oversized Noir" className="bg-white rounded-xl border-slate-200 h-10" />
                  {form.formState.errors.name && <p className="text-xs text-rose-500 font-medium">{form.formState.errors.name.message as string}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="sku" className="text-xs font-semibold text-slate-700">SKU de Referência</Label>
                  <Input id="sku" {...form.register('sku')} placeholder="Ex: DI-CAM-NOIR" className="bg-white rounded-xl border-slate-200 h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-semibold text-slate-700">Preço de Venda (R$)</Label>
                  <Input id="price" type="number" step="0.01" {...form.register('price')} className="bg-white rounded-xl border-slate-200 h-10 font-bold font-mono" />
                  {form.formState.errors.price && <p className="text-xs text-rose-500 font-medium">{form.formState.errors.price.message as string}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="originalPrice" className="text-xs font-semibold text-slate-700 font-mono">Preço Original / De (R$)</Label>
                  <Input id="originalPrice" type="number" step="0.01" {...form.register('originalPrice')} className="bg-white rounded-xl border-slate-200 h-10 font-mono" />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="stockQuantity" className="text-xs font-semibold text-slate-700">Estoque Geral</Label>
                  <Input 
                    id="stockQuantity" 
                    type="number" 
                    {...form.register('stockQuantity')} 
                    disabled={variations.length > 0}
                    className="bg-slate-100 disabled:opacity-85 font-bold rounded-xl border-slate-200 h-10" 
                  />
                  {variations.length > 0 && (
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Calculado automaticamente com base nas variações.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5 align-top">
                  <Label htmlFor="categoryId" className="text-xs font-semibold text-slate-700">Categoria do Produto</Label>
                  <div key={`${categories.length}-${form.watch('categoryId')}`}>
                    <Select 
                      value={form.watch('categoryId')} 
                      onValueChange={(val) => form.setValue('categoryId', val)}
                    >
                      <SelectTrigger id="categoryId" className="bg-white rounded-xl border-slate-200 h-10 w-full">
                        <SelectValue placeholder="Selecione uma categoria ativa">
                          {categories.find(c => c.id === form.watch('categoryId'))?.name || ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.formState.errors.categoryId && <p className="text-xs text-rose-500 font-medium">{form.formState.errors.categoryId.message as string}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold text-slate-700">Descrição Detalhada</Label>
                  <Textarea id="description" {...form.register('description')} placeholder="Descreva os materiais, corte, caimento e sugestões de uso do vestuário..." className="bg-white rounded-xl border-slate-200 min-h-[80px]" />
                </div>
              </div>
            </div>

            {/* Part 2: Multiselection Fields (Sizes & Colors) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Tamanhos Box */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Tamanhos Disponíveis</Label>
                  {activeCategory?.allowedSizes && activeCategory.allowedSizes.length > 0 && (
                    <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">Grade Customizada</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentAvailableSizes.map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSizeToggle(sz)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/15' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Escolha todos os tamanhos que este modelo disponibiliza.</p>
              </div>

              {/* Cores Box */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Cores Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((c) => {
                    const isSelected = selectedColors.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleColorToggle(c.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/15' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span 
                          className="h-3 w-3 rounded-full border border-slate-150 inline-block shadow-sm shrink-0" 
                          style={{ backgroundColor: c.colorCode }}
                        />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Escolha todas as cores disponíveis no site.</p>
              </div>
            </div>

            {/* Part 3: Auto Variations Form */}
            {variations.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600">Grade de Variações Gerada</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{variations.length} Combinações</span>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {variations.map((v, i) => (
                    <div 
                      key={`${v.color}-${v.size}`}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white border border-slate-200 p-3.5 rounded-xl items-center shadow-sm"
                    >
                      {/* Name tag */}
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {v.color} / {v.size}
                        </span>
                      </div>

                      {/* Stock quantity */}
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase">Estoque</Label>
                        <Input 
                          type="number"
                          value={v.stockQuantity}
                          onChange={(e) => handleVariationFieldChange(i, 'stockQuantity', Number(e.target.value) || 0)}
                          placeholder="Estoque"
                          className="h-9 text-xs rounded-lg border-slate-250 bg-white"
                        />
                      </div>

                      {/* Selling price */}
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase">Preço (R$)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => handleVariationFieldChange(i, 'price', Number(e.target.value) || 0)}
                          placeholder="Preço"
                          className="h-9 text-xs rounded-lg border-slate-250 bg-white font-mono"
                        />
                      </div>

                      {/* SKU Reference */}
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase">SKU (Opcional)</Label>
                        <Input 
                          type="text"
                          value={v.sku || ''}
                          onChange={(e) => handleVariationFieldChange(i, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="h-9 text-xs rounded-lg border-slate-250 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Part 4: Toggle switches/flags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-150">
              
              {/* Switch Active */}
              <div className="flex items-center space-x-3 h-10 bg-white border p-3 rounded-xl shadow-sm">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    id="is-active"
                    type="checkbox" 
                    checked={form.watch('isActive')} 
                    onChange={(e) => form.setValue('isActive', e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-xs font-bold text-slate-700 cursor-pointer">Produto Ativo</span>
                </label>
              </div>

              {/* Switch New */}
              <div className="flex items-center space-x-3 h-10 bg-white border p-3 rounded-xl shadow-sm">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    id="is-new"
                    type="checkbox" 
                    checked={form.watch('isNew')} 
                    onChange={(e) => form.setValue('isNew', e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-xs font-bold text-slate-700 cursor-pointer">Marcar como Novo</span>
                </label>
              </div>

              {/* Switch Featured (preserves feature) */}
              <div className="flex items-center space-x-3 h-10 bg-white border p-3 rounded-xl shadow-sm">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    id="is-featured"
                    type="checkbox" 
                    checked={form.watch('isFeatured')} 
                    onChange={(e) => form.setValue('isFeatured', e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-xs font-bold text-slate-700 cursor-pointer">Destaque na Home</span>
                </label>
              </div>
            </div>

          </div>

          {/* Fixed Footer */}
          <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-xl h-11 bg-white hover:bg-slate-50 font-bold border-slate-250">
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-8 cursor-pointer" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
