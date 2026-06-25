import { useEffect, useState } from 'react';
import { db, auth } from '@/src/integrations/firebase/client';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, Pencil, Trash2, Search, ExternalLink, PackageOpen, 
  AlertTriangle, CheckCircle, Percent, ArrowUpDown, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import ProductFormDialog from '@/src/components/admin/ProductFormDialog';
import { Link } from 'react-router-dom';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Extra visual quick states
  const [activeCount, setActiveCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [featuredCount, setFeaturedCount] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(list);

      // Calculations for metrics
      setActiveCount(list.filter((p: any) => p.isActive).length);
      setLowStockCount(list.filter((p: any) => (p.stockQuantity || 0) <= 5).length);
      setFeaturedCount(list.filter((p: any) => p.isFeatured).length);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Produto excluído com sucesso');
      fetchProducts();
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const filterProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Page Title & Add flow */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
            Produtos Cadastrados
          </h1>
          <p className="text-slate-500 mt-1">
            Controle de preços, variações, flags promocionais e estoque.
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-6 cursor-pointer shadow-lg shadow-blue-500/10" 
          onClick={() => { setSelectedProduct(null); setIsDialogOpen(true); }}
        >
          <Plus className="h-4.5 w-4.5" /> Adicionar Produto
        </Button>
      </div>

      {/* Quick Visual Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <PackageOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Cadastrado</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : products.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Ativos na Venda</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : activeCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Estoque Crítico (≤ 5)</span>
            <span className="text-xl font-extrabold text-rose-600">{loading ? '...' : lowStockCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Destaques na Home</span>
            <span className="text-xl font-bold text-slate-800">{loading ? '...' : featuredCount}</span>
          </div>
        </div>
      </div>

      {/* Filtering input bar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Filtrar por nome do produto, variação ou SKU..." 
            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main visual datagrid */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px] pl-6 font-bold text-slate-700 py-4">Foto</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Nome do Produto</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Estoque</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Preço Venda</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Preço Original</TableHead>
              <TableHead className="font-bold text-slate-700 py-4">Indicadores</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 text-sm">
                  Carregando catálogo de produtos...
                </TableCell>
              </TableRow>
            ) : filterProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 text-sm">
                  Nenhum produto cadastrado com os nomes fornecidos.
                </TableCell>
              </TableRow>
            ) : (
              filterProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/40 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="h-14 w-14 rounded-xl overflow-hidden border border-slate-100 shrink-0 bg-slate-100 flex items-center justify-center">
                      {(() => {
                        const firstMedia = product.images?.[0];
                        const url = firstMedia?.url || "";
                        const isVideo = firstMedia?.type === 'video' || (url.split('?')[0].toLowerCase().endsWith('.mp4'));
                        if (!url) {
                          return <img src="https://placehold.co/120x120?text=Sem+Foto" className="h-full w-full object-cover" alt="" />;
                        }
                        if (isVideo) {
                          return <video src={url} className="h-full w-full object-cover" muted loop autoPlay playsInline />;
                        }
                        return <img src={url} className="h-full w-full object-cover" alt={product.name} referrerPolicy="no-referrer" />;
                      })()}
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {product.sku || '-'}</div>
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge 
                      variant={product.stockQuantity > 5 ? 'outline' : 'destructive'} 
                      className={`rounded-full text-[10px] font-bold ${
                        product.stockQuantity > 5 
                          ? 'bg-slate-50 text-slate-700 border-slate-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                      }`}
                    >
                      {product.stockQuantity || 0} un.
                    </Badge>
                  </TableCell>

                  <TableCell className="py-4 font-extrabold text-slate-950 font-mono text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </TableCell>

                  <TableCell className="py-4 text-slate-400 text-xs line-through font-mono">
                    {product.originalPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice) : '-'}
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {product.isActive ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-full text-[9px] font-bold hover:bg-emerald-50">Ativo</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-[9px] font-bold hover:bg-slate-100">Pausado</Badge>
                      )}
                      {product.isFeatured && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[9px] font-bold hover:bg-blue-50">Destaque</Badge>
                      )}
                      {product.isNew && (
                        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[9px] font-bold hover:bg-indigo-50">Novidade</Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-4 text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Link to={`/produto/${product.id}`} target="_blank">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl h-9 w-9 text-slate-500 hover:bg-slate-100 cursor-pointer"
                          title="Visualizar na loja"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-slate-500 hover:bg-slate-100 cursor-pointer" 
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer" 
                        onClick={() => handleDelete(product.id)}
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

      <ProductFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
