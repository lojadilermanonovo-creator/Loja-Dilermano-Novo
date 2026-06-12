import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tag, Percent, Scissors, CircleDollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(0);
  const [maxUses, setMaxUses] = useState(100);
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })));
    } catch (e) {
      toast.error('Erro ao listar cupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenDialog = (c?: any) => {
    if (c) {
      setSelectedCoupon(c);
      setCode(c.code || '');
      setType(c.type || 'percentage');
      setValue(c.value || 0);
      setMaxUses(c.maxUses || 0);
      setIsActive(c.isActive ?? true);
    } else {
      setSelectedCoupon(null);
      setCode('');
      setType('percentage');
      setValue(0);
      setMaxUses(100);
      setIsActive(true);
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) {
      toast.error('Informe o código do cupom');
      return;
    }
    if (value <= 0) {
      toast.error('Informe um valor de desconto válido maior que zero');
      return;
    }

    try {
      const data = {
        code: formattedCode,
        type,
        value: Number(value),
        maxUses: Number(maxUses),
        isActive,
        updatedAt: serverTimestamp(),
      };

      if (selectedCoupon) {
        await updateDoc(doc(db, 'coupons', selectedCoupon.id), data);
        toast.success('Cupom atualizado com sucesso!');
      } else {
        // Create
        await setDoc(doc(db, 'coupons', formattedCode), {
          ...data,
          usedCount: 0,
          createdAt: serverTimestamp(),
        });
        toast.success('Cupom criado e ativo com sucesso!');
      }
      fetchCoupons();
      setIsOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar cupom');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Cupom removido!');
      fetchCoupons();
    } catch (error) {
      toast.error('Erro ao deletar cupom');
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
            Cupons de Desconto
          </h1>
          <p className="text-slate-500 mt-1">
            Configure campanhas promocionais com descontos percentuais ou fixos.
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-6 cursor-pointer shadow-lg shadow-blue-500/10"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="h-4.5 w-4.5" /> Adicionar Cupom
        </Button>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Cupons no Banco</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : coupons.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-medium">Cupons Ativos</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : coupons.filter(c => c.isActive).length}</span>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="pl-6 font-bold text-slate-700 py-4">Cupom / Código</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Tipo Desconto</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Desconto</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Uso (Limite máximo)</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Status</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-slate-400 text-sm">
                  Lendo cupons cadastrados...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-slate-400 text-sm">
                  Nenhum cupom ativo registrado. Crie um desconto especial no topo!
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/40 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-blue-500" />
                      <span className="font-extrabold text-slate-900 text-sm font-mono tracking-wider">{c.code}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-4 text-xs font-semibold text-slate-650 capitalize">
                    {c.type === 'percentage' ? 'Percentual (%)' : 'Fixo (R$)'}
                  </TableCell>

                  <TableCell className="py-4 font-extrabold text-slate-905 font-mono text-xs">
                    {c.type === 'percentage' ? `${c.value}%` : `R$ ${Number(c.value).toFixed(2)}`}
                  </TableCell>

                  <TableCell className="py-4 text-xs text-slate-500 font-semibold">
                    {c.usedCount || 0} / {c.maxUses || 'ilimitado'}
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      c.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 hover:bg-emerald-50' 
                        : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-50'
                    }`}>
                      {c.isActive ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-slate-500 hover:bg-slate-100 cursor-pointer" 
                        onClick={() => handleOpenDialog(c)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer" 
                        onClick={() => handleDelete(c.id)}
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
              {selectedCoupon ? 'Editar Código de Cupom' : 'Novo Cupom Promocional'}
            </DialogTitle>
            <DialogDescription>
              Defina as restrições de uso, porcentagens e códigos alfanuméricos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-slate-700 font-semibold text-xs">Código do Cupom</Label>
              <Input 
                id="code" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="Ex: QUERO10" 
                className="rounded-xl border-slate-200 text-sm uppercase font-mono tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-slate-700 font-semibold text-xs">Tipo de Desconto</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger id="type" className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="percentage" className="cursor-pointer">Percentual (%)</SelectItem>
                  <SelectItem value="fixed" className="cursor-pointer">Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="value" className="text-slate-700 font-semibold text-xs">Desconto Concedido</Label>
              <Input 
                id="value" 
                type="number" 
                value={value} 
                onChange={(e) => setValue(Number(e.target.value))} 
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxUses" className="text-slate-700 font-semibold text-xs font-mono">Limite Máximo de Usos</Label>
              <Input 
                id="maxUses" 
                type="number" 
                value={maxUses} 
                onChange={(e) => setMaxUses(Number(e.target.value))} 
                className="rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="coupon-active"
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 cursor-pointer">Reconhecer Cupom Ativo</span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl h-11 bg-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-6">
              Salvar Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
