import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/src/integrations/firebase/client';
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ProductImageManager from './ProductImageManager';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function ProductFormDialog({ open, onOpenChange, product, onSuccess }: ProductFormDialogProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      originalPrice: 0,
      sku: '',
      description: '',
      categoryId: '',
      stockQuantity: 1,
      isActive: true,
      isFeatured: false,
      isNew: false,
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product) {
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
    } else {
      form.reset({
        name: '', price: 0, originalPrice: 0, sku: '', description: '', 
        categoryId: '', stockQuantity: 1, isActive: true, isFeatured: false, isNew: false
      });
      setImages([]);
    }
  }, [product, form, open]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const productData = {
        ...values,
        images,
        updatedAt: serverTimestamp(),
      };

      if (product) {
        await updateDoc(doc(db, 'products', product.id), productData);
        toast.success('Produto atualizado com sucesso');
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, {
          ...productData,
          createdAt: serverTimestamp(),
        });
        toast.success('Produto criado com sucesso');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-4">
              <ProductImageManager images={images} onChange={setImages} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input id="name" {...form.register('name')} placeholder="Ex: Camiseta Oversized Ocean" />
                  {form.formState.errors.name && <p className="text-xs text-sunset">{form.formState.errors.name.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...form.register('sku')} placeholder="Ex: DI-CAM-BLUE" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Venda (R$)</Label>
                  <Input id="price" type="number" step="0.01" {...form.register('price')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Preço Original (R$)</Label>
                  <Input id="originalPrice" type="number" step="0.01" {...form.register('originalPrice')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Quantidade Estoque</Label>
                  <Input id="stockQuantity" type="number" {...form.register('stockQuantity')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select 
                  value={form.watch('categoryId')} 
                  onValueChange={(val) => form.setValue('categoryId', val)}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && <p className="text-xs text-sunset">{form.formState.errors.categoryId.message as string}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" {...form.register('description')} placeholder="Descreva os detalhes do produto..." className="min-h-[100px]" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isActive" 
                    checked={form.watch('isActive')} 
                    onCheckedChange={(checked) => form.setValue('isActive', !!checked)} 
                  />
                  <Label htmlFor="isActive">Ativo no site</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isFeatured" 
                    checked={form.watch('isFeatured')} 
                    onCheckedChange={(checked) => form.setValue('isFeatured', !!checked)} 
                  />
                  <Label htmlFor="isFeatured">Destaque na Home</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isNew" 
                    checked={form.watch('isNew')} 
                    onCheckedChange={(checked) => form.setValue('isNew', !!checked)} 
                  />
                  <Label htmlFor="isNew">Marcar como NOVO</Label>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 border-t pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-xl">Cancelar</Button>
            <Button type="submit" className="bg-ocean hover:bg-ocean/90 font-bold rounded-xl px-10" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
