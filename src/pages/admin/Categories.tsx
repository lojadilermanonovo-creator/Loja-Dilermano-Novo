import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, getDocs, deleteDoc, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, FolderTree, Layers, ShieldCheck, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_SIZES = [
  'PP', 'P', 'M', 'G', 'GG', 'XGG',
  '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'
];

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [allowedSizes, setAllowedSizes] = useState<string[]>([]);

  // Stats
  const [activeCount, setActiveCount] = useState(0);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort locally by sortOrder
      list.sort((a,b) => (a.sortOrder || 1) - (b.sortOrder || 1));
      setCategories(list);
      setActiveCount(list.filter(c => c.isActive).length);
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
      setName(category.name || '');
      setImageUrl(category.imageUrl || '');
      setIsActive(category.isActive ?? true);
      setAllowedSizes(category.allowedSizes || []);
    } else {
      setSelectedCategory(null);
      setName('');
      setImageUrl('');
      setIsActive(true);
      setAllowedSizes([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name) {
      toast.error('Por favor, informe o nome para a nova categoria');
      return;
    }
    try {
      const data = {
        name,
        imageUrl,
        isActive,
        allowedSizes,
        updatedAt: serverTimestamp(),
      };

      if (selectedCategory) {
        // Edit flow
        const activeCountExcludingMe = categories.filter(c => c.isActive && c.id !== selectedCategory.id).length;
        if (isActive && activeCountExcludingMe >= 6) {
          toast.error('O sistema permite no máximo 6 categorias ativas em exibição');
          return;
        }

        await updateDoc(doc(db, 'categories', selectedCategory.id), data);
        toast.success('Categoria atualizada com sucesso');
      } else {
        // Create flow
        if (isActive && activeCount >= 6) {
           toast.error('Limite excedido! Limite de 6 categorias ativas permitido.');
           return;
        }
        await setDoc(doc(collection(db, 'categories')), {
          ...data,
          createdAt: serverTimestamp(),
          sortOrder: categories.length + 1
        });
        toast.success('Categoria adicionada ao catálogo');
      }
      fetchCategories();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta categoria? Produtos vinculados a ela não serão excluídos.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Categoria excluída com sucesso');
      fetchCategories();
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Page Title & actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
            Categorias do Site
          </h1>
          <p className="text-slate-500 mt-1">
            Organize seus produtos. No máximo 6 categorias ativas aparecem na vitrine do seu site.
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-6 cursor-pointer shadow-lg shadow-blue-500/10" 
          onClick={() => handleOpenDialog()}
        >
          <Plus className="h-4.5 w-4.5" /> Adicionar Categoria
        </Button>
      </div>

      {/* Quick Category Stats metrics info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Categorias Cadastradas</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : categories.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Ativas (Lim. 6)</span>
            <span className="text-xl font-extrabold text-emerald-600">{loading ? '...' : `${activeCount}/6`}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
            <EyeOff className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Inativas</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : categories.length - activeCount}</span>
          </div>
        </div>
      </div>

      {/* Categories datagrid list */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px] pl-6 font-bold text-slate-700 py-4">Preview</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Nome da Categoria</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">ID de Referência</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Status de Exibição</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400 text-sm">
                  Carregando coleções de categorias...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400 text-sm">
                  Nenhuma categoria registrada no banco de dados.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-slate-50/40 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-150">
                      <img 
                        src={cat.imageUrl || "https://placehold.co/100x100?text=Sem+Foto"} 
                        className="h-full w-full object-cover" 
                        alt={cat.name} 
                      />
                    </div>
                  </TableCell>

                  <TableCell className="py-4 font-bold text-slate-900 text-sm">
                    <div>{cat.name}</div>
                    {cat.allowedSizes && cat.allowedSizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1 font-normal">
                        {cat.allowedSizes.map((s: string) => (
                          <span key={s} className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-md font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-normal block mt-1">Grade Geral (Padrão)</span>
                    )}
                  </TableCell>

                  <TableCell className="py-4 text-xs font-mono text-slate-400">
                    {cat.id}
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge 
                      variant={cat.isActive ? 'default' : 'secondary'}
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                        cat.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 hover:bg-emerald-50' 
                          : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenDialog(cat)}
                        className="rounded-xl h-9 w-9 text-slate-500 hover:bg-slate-100 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer" 
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Category Editor modal drawer dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {selectedCategory ? 'Editar Categoria' : 'Nova Categoria de Prateleira'}
            </DialogTitle>
            <DialogDescription>
              Insira o nome amigável e uma URL de foto de alta resolução (ex: Unsplash) para compor a categoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-slate-700 font-semibold text-xs">Nome de Coleção</Label>
              <Input 
                id="cat-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: Coleção Masculina" 
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-url" className="text-slate-700 font-semibold text-xs">URL da Imagem Banner</Label>
              <Input 
                id="cat-url" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                placeholder="https://images.unsplash.com/photo-..." 
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-2 pt-1 pb-1">
              <Label className="text-slate-700 font-semibold text-xs">Grade de Tamanhos Permitida (allowedSizes)</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_SIZES.map((sz) => {
                  const isSelected = allowedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setAllowedSizes(allowedSizes.filter(s => s !== sz));
                        } else {
                          setAllowedSizes([...allowedSizes, sz]);
                        }
                      }}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
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
              <p className="text-[10px] text-slate-400 leading-tight">
                Selecione os tamanhos dessa categoria para a vitrine. Se vazio, o catálogo usará a grade completa como fallback.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="cat-active"
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 cursor-pointer">Categoria Ativa na Vitrine</span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-11 font-medium bg-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-11 px-6 cursor-pointer text-white">
              Salvar Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
