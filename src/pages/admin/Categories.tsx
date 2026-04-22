import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, getDocs, deleteDoc, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('Erro ao buscar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setSelectedCategory(category);
      setName(category.name);
      setImageUrl(category.imageUrl || '');
      setIsActive(category.isActive ?? true);
    } else {
      setSelectedCategory(null);
      setName('');
      setImageUrl('');
      setIsActive(true);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name) return;
    try {
      const data = {
        name,
        imageUrl,
        isActive,
        updatedAt: serverTimestamp(),
      };

      if (selectedCategory) {
        await updateDoc(doc(db, 'categories', selectedCategory.id), data);
        toast.success('Categoria atualizada');
      } else {
        const activeCount = categories.filter(c => c.isActive).length;
        if (isActive && activeCount >= 6) {
           toast.error('Máximo de 6 categorias ativas permitido');
           return;
        }
        await setDoc(doc(collection(db, 'categories')), {
          ...data,
          createdAt: serverTimestamp(),
          sortOrder: categories.length + 1
        });
        toast.success('Categoria criada');
      }
      fetchCategories();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Categoria excluída');
      fetchCategories();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Categorias</h1>
          <p className="text-muted-foreground">Máximo de 6 categorias ativas no site.</p>
        </div>
        <Button className="bg-ocean hover:bg-ocean/90 rounded-xl gap-2 font-bold" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
            ) : categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                   <img src={cat.imageUrl} className="h-10 w-10 rounded-lg object-cover" alt="" />
                </TableCell>
                <TableCell className="font-bold">{cat.name}</TableCell>
                <TableCell>
                   <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                     {cat.isActive ? 'Ativa' : 'Inativa'}
                   </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <div className="flex justify-end gap-2">
                     <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cat)}><Pencil className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" className="text-sunset" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="uppercase font-black tracking-tighter text-2xl">
              {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label>Nome da Categoria</Label>
               <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Masculino" />
             </div>
             <div className="space-y-2">
               <Label>URL da Imagem</Label>
               <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
             </div>
             <div className="flex items-center gap-2">
               <input 
                 type="checkbox" 
                 id="catActive" 
                 checked={isActive} 
                 onChange={(e) => setIsActive(e.target.checked)} 
               />
               <Label htmlFor="catActive">Categoria Ativa</Label>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-ocean hover:bg-ocean/90 font-bold" onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
