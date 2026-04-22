import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ProductFormDialog from '@/src/components/admin/ProductFormDialog';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Produto excluído');
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const filterProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o inventário da loja.</p>
        </div>
        <Button className="bg-ocean hover:bg-ocean/90 rounded-xl gap-2 font-bold" onClick={() => { setSelectedProduct(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome ou SKU..." 
          className="pl-10 h-12 rounded-xl bg-card"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-2xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Carregando...</TableCell>
              </TableRow>
            ) : filterProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum produto encontrado</TableCell>
              </TableRow>
            ) : filterProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <img 
                    src={product.images?.[0]?.url || "https://placehold.co/100x100?text=Sem+Foto"} 
                    className="h-12 w-12 rounded-lg object-cover" 
                    alt={product.name}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-bold">{product.name}</div>
                  <div className="text-xs text-muted-foreground">SKU: {product.sku || '-'}</div>
                </TableCell>
                <TableCell>
                   <div className="font-medium text-sm">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                   </div>
                   {product.originalPrice && product.originalPrice > product.price && (
                     <div className="text-[10px] text-muted-foreground line-through">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)}
                     </div>
                   )}
                </TableCell>
                <TableCell>
                   <Badge variant={product.stockQuantity > 5 ? 'outline' : 'destructive'} className="rounded-full">
                     {product.stockQuantity || 0} unid.
                   </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {product.isActive ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-full">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full">Inativo</Badge>
                    )}
                    {product.isFeatured && <Badge className="bg-ocean rounded-full">Destaque</Badge>}
                    {product.isNew && <Badge className="bg-sunset rounded-full">Novo</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/produto/${product.id}`} target="_blank">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-sunset hover:text-sunset" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
