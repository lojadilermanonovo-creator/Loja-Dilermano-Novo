import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, ShieldAlert, Phone, Mail, FileText, Trash2, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setCustomers(list);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este usuário da base administrativa?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('Cliente removido de forma segura!');
      fetchCustomers();
    } catch (error) {
      toast.error('Erro ao excluir registro de cliente');
    }
  };

  const filtered = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term) ||
      (c.cpf || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
            Clientes Cadastrados
          </h1>
          <p className="text-slate-500 mt-1">
            Lista e controle de perfis de compradores integrados pelo Firebase Auth.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total de Compradores</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : customers.length}</span>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-medium">Novos este Mês</span>
            <span className="text-xl font-bold text-emerald-650">{loading ? '...' : customers.filter(c => c.createdAt).length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Cadastros com CPF</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : customers.filter(c => c.cpf).length}</span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filtrar por nome, CPF, e-mail do cliente ou telefone..." 
            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Datagrid Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="pl-6 font-bold text-slate-700 py-4">Nome do Cliente</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Contato (Email / Fone)</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">CPF</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Data de Cadastro</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400 text-sm">
                  Procurando registros de usuários...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400 text-sm">
                  Nenhum cliente cadastrado atende aos critérios da busca.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client) => {
                const regDate = client.createdAt?.seconds 
                  ? new Date(client.createdAt.seconds * 1000).toLocaleDateString('pt-BR') 
                  : 'N/A';
                return (
                  <TableRow key={client.id} className="hover:bg-slate-50/40 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{client.name || 'Sem nome cadastrado'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {client.id}</div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" /> {client.email || '-'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Phone className="h-3 w-3 text-slate-300 shrink-0" /> {client.phone || '-'}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 font-mono text-xs text-slate-600">
                      {client.cpf || 'Não Informado'}
                    </TableCell>

                    <TableCell className="py-4 text-xs text-slate-500 font-semibold">
                      {regDate}
                    </TableCell>

                    <TableCell className="py-4 text-right pr-6">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer" 
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
