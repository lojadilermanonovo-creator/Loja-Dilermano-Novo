import { useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings, Save, Phone, QrCode, MapPin, Store, Sparkles } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for general config
  const [storeName, setStoreName] = useState('Dilermando Store');
  const [whatsapp, setWhatsapp] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'general'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreName(data.storeName || 'Dilermando Store');
        setWhatsapp(data.whatsapp || '');
        setPixKey(data.pixKey || '');
        setPickupAddress(data.pickupAddress || '');
      } else {
        // Setup initial default
        await setDoc(doc(db, 'settings', 'general'), {
          storeName: 'Dilermando Store',
          whatsapp: '',
          pixKey: '',
          pickupAddress: '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao buscar as configurações gerais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        storeName,
        whatsapp,
        pixKey,
        pickupAddress,
        updatedAt: serverTimestamp(),
      });
      toast.success('Configurações armazenadas com sucesso no Firestore!');
    } catch (e) {
      toast.error('Erro ao atualizar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center gap-2">
            <Settings className="h-7 w-7 text-blue-600" />
            Configurações do Sistema
          </h1>
          <p className="text-slate-500 mt-1">
            Modifique chaves e informações operacionais do e-commerce Dilermando.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-semibold text-sm">
          Acessando as preferências da loja...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Config Geral */}
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b p-6">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Store className="h-4.5 w-4.5 text-blue-500" /> Perfil da Loja
              </CardTitle>
              <CardDescription className="text-xs">
                Nome visível da sua marca nos cabeçalhos e correspondências.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pref-storeName" className="text-xs font-semibold text-slate-705">Nome Fantasia da Loja</Label>
                <Input 
                  id="pref-storeName" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)}
                  className="rounded-xl border-slate-200 h-10 bg-white" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Card Contact Config */}
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-slate-50 border-b p-6">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Phone className="h-4.5 w-4.5 text-green-500 animate-pulse" /> Atendimento e Suporte
              </CardTitle>
              <CardDescription className="text-xs">
                Contatos telefônicos para o botão flutuante de atendimento e WhatsApp da loja.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5 animate-fade-in">
                <Label htmlFor="pref-whatsapp" className="text-xs font-semibold text-slate-705">Número de Celular para WhatsApp (Ex: +5543999998888)</Label>
                <Input 
                  id="pref-whatsapp" 
                  placeholder="+55" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="rounded-xl border-slate-200 h-10 bg-white font-mono" 
                />
                <p className="text-[10px] text-slate-400">Insira o código do país, DDD e os dígitos corridos.</p>
              </div>
            </CardContent>
          </Card>

          {/* Card Payment Info */}
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-slate-50 border-b p-6">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <QrCode className="h-4.5 w-4.5 text-blue-500" /> Cobrança e PIX
              </CardTitle>
              <CardDescription className="text-xs">
                Chave PIX exibida na conclusão de compra para transferência dos compradores.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pref-pix" className="text-xs font-semibold text-slate-705">Chave PIX de Recebimento</Label>
                <Input 
                  id="pref-pix" 
                  placeholder="E-mail, CNPJ, telefone celular ou chave aleatória" 
                  value={pixKey} 
                  onChange={(e) => setPixKey(e.target.value)}
                  className="rounded-xl border-slate-200 h-10 bg-white" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Card Pickup Address */}
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm font-sans">
            <CardHeader className="bg-slate-50 border-b p-6">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-rose-500" /> Retiradas no Local
              </CardTitle>
              <CardDescription className="text-xs">
                Endereço disponível para compradores que marcarem a opção de retirar pessoalmente na finalização de checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pref-pickup" className="text-xs font-semibold text-slate-750">Endereço de Retirada Completo</Label>
                <Input 
                  id="pref-pickup" 
                  placeholder="Ex: Av. Principal, 1000 - Centro, Curitiba/PR" 
                  value={pickupAddress} 
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="rounded-xl border-slate-200 h-10 bg-white" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Confirm Bar */}
          <div className="flex justify-end pt-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-8 cursor-pointer shadow-lg shadow-blue-500/10"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
