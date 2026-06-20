import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/src/components/admin/ImageUploader';

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);

  // Form fields
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'banners'));
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
    } catch (e) {
      toast.error('Erro ao listar banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenDialog = (b?: any) => {
    if (b) {
      setSelectedBanner(b);
      setName(b.name || '');
      setImageUrl(b.imageUrl || '');
      setLink(b.link || '');
      setIsActive(b.isActive ?? true);
    } else {
      setSelectedBanner(null);
      setName('');
      setImageUrl('');
      setLink('');
      setIsActive(true);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe o título do banner');
      return;
    }
    if (!imageUrl.trim()) {
      toast.error('Cole a URL de imagem do banner');
      return;
    }

    const activeBannersCount = banners.filter(b => b.isActive).length;
    
    // Check if activating is going to exceed limit
    if (isActive) {
      if (selectedBanner) {
        // Edit mode validation
        const wasActive = selectedBanner.isActive;
        if (!wasActive && activeBannersCount >= 5) {
          toast.error('O limite de 5 banners ativos simultaneamente foi atingido.');
          return;
        }
      } else {
        // Creation mode validation
        if (activeBannersCount >= 5) {
          toast.error('O limite de 5 banners ativos simultaneamente foi atingido.');
          return;
        }
      }
    }

    try {
      const data = {
        name,
        imageUrl,
        link,
        isActive,
        updatedAt: serverTimestamp(),
      };

      if (selectedBanner) {
        await updateDoc(doc(db, 'banners', selectedBanner.id), data);
        toast.success('Banner atualizado com sucesso!');
      } else {
        const newDocRef = doc(collection(db, 'banners'));
        await setDoc(newDocRef, {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast.success('Novo banner criado e ativado!');
      }
      fetchBanners();
      setIsOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar Banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar este banner permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      toast.success('Banner removido!');
      fetchBanners();
    } catch (error) {
      toast.error('Erro ao deletar banner');
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
            Banners Rotativos
          </h1>
          <p className="text-slate-500 mt-1">
            Configure imagens em 1920x800 para a vitrine principal. No máximo 5 banners ativos podem rodar.
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-6 cursor-pointer shadow-lg shadow-blue-500/10"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="h-4.5 w-4.5" /> Adicionar Banner
        </Button>
      </div>

      {/* Metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Banners Totais</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : banners.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-medium">Ativos (Máx 5)</span>
            <span className="text-xl font-extrabold text-slate-800">{loading ? '...' : `${banners.filter(b => b.isActive).length}/5`}</span>
          </div>
        </div>
      </div>

      {/* Grid displaying cards */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[180px] pl-6 font-bold text-slate-700 py-4">Preview</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Nome de Identificação</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Link Destino</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Status</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400 text-sm">
                  Lendo banners promocionais...
                </TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400 text-sm">
                  Nenhum banner cadastrado para exibição na home. Crie um novo acima!
                </TableCell>
              </TableRow>
            ) : (
              banners.map((b) => (
                <TableRow key={b.id} className="hover:bg-slate-50/40 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="h-11 w-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={b.imageUrl} className="h-full w-full object-cover" alt="Preview Banner" referrerPolicy="no-referrer" />
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 text-slate-900 font-bold text-sm">
                    {b.name}
                  </TableCell>

                  <TableCell className="py-4 text-xs font-mono text-slate-500">
                    {b.link || 'Nenhum'}
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      b.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 hover:bg-emerald-50' 
                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-50'
                    }`}>
                      {b.isActive ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-slate-500 hover:bg-slate-100 cursor-pointer" 
                        onClick={() => handleOpenDialog(b)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer" 
                        onClick={() => handleDelete(b.id)}
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {selectedBanner ? 'Editar Banner rotativo' : 'Adicionar Novo Banner'}
            </DialogTitle>
            <DialogDescription>
              Insira a URL de um banner idealmente horizontal (1920x800).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="b-name" className="text-slate-700 font-semibold text-xs">Identificação do Banner</Label>
              <Input 
                id="b-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: Campanha de Inverno" 
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                folder="banners"
                label="Imagem do Banner (Recomendado: 1920x800)"
                placeholder="Cole a URL ou suba um arquivo"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-link" className="text-slate-700 font-semibold text-xs">Link redirecionamento (Opcional)</Label>
              <Input 
                id="b-link" 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                placeholder="Ex: /categoria/masculino" 
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="banner-active"
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 cursor-pointer">Banner Ativo na Vitrine</span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl h-11 bg-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-6">
              Salvar Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
