import { useEffect, useState } from 'react';
import { db, functions } from '@/src/integrations/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Settings, Save, Phone, QrCode, MapPin, Store, 
  Globe, Key, RefreshCw, AlertCircle, CheckCircle2, Truck,
  Megaphone, Palette, Trash2, AlertTriangle, Download
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';

export default function AdminSettings() {
  const { isAdmin: authIsAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'melhorenvio' | 'promocta'>('general');

  // States for general config
  const [storeName, setStoreName] = useState('Dilermando Store');
  const [whatsapp, setWhatsapp] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  // States for Promo CTA
  const [ctaActive, setCtaActive] = useState(true);
  const [ctaTitle, setCtaTitle] = useState('Frete Grátis acima de R$ {valor}');
  const [ctaSubtitle, setCtaSubtitle] = useState('Aproveite para renovar seu guarda-roupa sem se preocupar com a entrega. Parcele em até {parcelas} sem juros.');
  const [ctaValue, setCtaValue] = useState<number | ''>(299);
  const [ctaInstallments, setCtaInstallments] = useState<number | ''>(5);
  const [ctaButtonText, setCtaButtonText] = useState('Aproveitar Agora');
  const [ctaButtonLink, setCtaButtonLink] = useState('/categoria/promocoes');
  const [ctaBgColor, setCtaBgColor] = useState('#2563EB');
  const [ctaTextColor, setCtaTextColor] = useState('#FFFFFF');

  // States for Melhor Envio
  const [meClientId, setMeClientId] = useState('');
  const [meClientSecret, setMeClientSecret] = useState('');
  const [meOriginZip, setMeOriginZip] = useState('');
  const [meMode, setMeMode] = useState<'sandbox' | 'production'>('sandbox');
  const [meConnected, setMeConnected] = useState(false);
  const [meExpiresAt, setMeExpiresAt] = useState<number | null>(null);

  // States for clean test orders dialog
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 1. General Config
      const docSnap = await getDoc(doc(db, 'settings', 'general'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreName(data.storeName || 'Dilermando Store');
        setWhatsapp(data.whatsapp || '');
        setPixKey(data.pixKey || '');
        setPickupAddress(data.pickupAddress || '');
      } else {
        await setDoc(doc(db, 'settings', 'general'), {
          storeName: 'Dilermando Store',
          whatsapp: '',
          pixKey: '',
          pickupAddress: '',
          createdAt: serverTimestamp(),
        });
      }

      // 2. Melhor Envio Settings
      const meSnap = await getDoc(doc(db, 'settings', 'melhorenvio'));
      if (meSnap.exists()) {
        const data = meSnap.data();
        setMeClientId(data.clientId || '');
        setMeClientSecret(data.clientSecret || '');
        setMeOriginZip(data.originZip || '');
        setMeMode(data.mode || 'sandbox');
      }

      // 3. Melhor Envio token connection status
      const tokensSnap = await getDoc(doc(db, 'settings', 'melhorenvio_tokens'));
      if (tokensSnap.exists()) {
        const tokenData = tokensSnap.data();
        if (tokenData && tokenData.expiresAt) {
          setMeConnected(Date.now() < tokenData.expiresAt);
          setMeExpiresAt(tokenData.expiresAt);
        } else {
          setMeConnected(false);
          setMeExpiresAt(null);
        }
      } else {
        setMeConnected(false);
        setMeExpiresAt(null);
      }

      // 4. Promo CTA Settings
      const promoSnap = await getDoc(doc(db, 'settings', 'promocta'));
      if (promoSnap.exists()) {
        const data = promoSnap.data();
        setCtaActive(data.active !== undefined ? data.active : true);
        setCtaTitle(data.title !== undefined ? data.title : 'Frete Grátis acima de R$ {valor}');
        setCtaSubtitle(data.subtitle !== undefined ? data.subtitle : 'Aproveite para renovar seu guarda-roupa sem se preocupar com a entrega. Parcele em até {parcelas} sem juros.');
        setCtaValue(data.value !== undefined ? data.value : 299);
        setCtaInstallments(data.installments !== undefined ? data.installments : 5);
        setCtaButtonText(data.buttonText !== undefined ? data.buttonText : 'Aproveitar Agora');
        setCtaButtonLink(data.buttonLink !== undefined ? data.buttonLink : '/categoria/promocoes');
        setCtaBgColor(data.bgColor !== undefined ? data.bgColor : '#2563EB');
        setCtaTextColor(data.textColor !== undefined ? data.textColor : '#FFFFFF');
      } else {
        setCtaActive(true);
        setCtaTitle('Frete Grátis acima de R$ {valor}');
        setCtaSubtitle('Aproveite para renovar seu guarda-roupa sem se preocupar com a entrega. Parcele em até {parcelas} sem juros.');
        setCtaValue(299);
        setCtaInstallments(5);
        setCtaButtonText('Aproveitar Agora');
        setCtaButtonLink('/categoria/promocoes');
        setCtaBgColor('#2563EB');
        setCtaTextColor('#FFFFFF');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao buscar as configurações do sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        storeName,
        whatsapp,
        pixKey,
        pickupAddress,
        updatedAt: serverTimestamp(),
      });
      toast.success('Configurações gerais atualizadas com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar as configurações gerais');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePromoCTA = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'promocta'), {
        active: ctaActive,
        title: ctaTitle,
        subtitle: ctaSubtitle,
        value: ctaValue === '' ? '' : Number(ctaValue),
        installments: ctaInstallments === '' ? '' : Number(ctaInstallments),
        buttonText: ctaButtonText,
        buttonLink: ctaButtonLink,
        bgColor: ctaBgColor,
        textColor: ctaTextColor,
        updatedAt: serverTimestamp(),
      });
      toast.success('Configurações do Banner Promocional atualizadas com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar as configurações do Banner Promocional');
    } finally {
      setSaving(false);
    }
  };

  const handleRestorePromoDefaults = () => {
    setCtaActive(true);
    setCtaTitle('Frete Grátis acima de R$ {valor}');
    setCtaSubtitle('Aproveite para renovar seu guarda-roupa sem se preocupar com a entrega. Parcele em até {parcelas} sem juros.');
    setCtaValue(299);
    setCtaInstallments(5);
    setCtaButtonText('Aproveitar Agora');
    setCtaButtonLink('/categoria/promocoes');
    setCtaBgColor('#2563EB');
    setCtaTextColor('#FFFFFF');
    toast.info('Valores padrão preenchidos. Clique em "Salvar Alterações" para gravar.');
  };

  const handleSaveMelhorEnvio = async () => {
    const cleanZip = meOriginZip.replace(/\D/g, '');
    if (meOriginZip && cleanZip.length !== 8) {
      toast.error('CEP de origem do Melhor Envio deve ter exatamente 8 dígitos');
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'melhorenvio'), {
        clientId: meClientId,
        clientSecret: meClientSecret,
        originZip: cleanZip,
        mode: meMode,
        updatedAt: serverTimestamp(),
      });
      toast.success('Configurações do Melhor Envio salvas com sucesso!');
      loadSettings();
    } catch (e) {
      toast.error('Erro ao salvar configurações do Melhor Envio');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectMelhorEnvio = async () => {
    if (!meClientId || !meClientSecret || !meOriginZip) {
      toast.error('Para conectar, configure primeiro o Client ID, Client Secret e o CEP de Origem.');
      return;
    }

    // Save configured options first to be used by functions
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'melhorenvio'), {
        clientId: meClientId,
        clientSecret: meClientSecret,
        originZip: meOriginZip.replace(/\D/g, ''),
        mode: meMode,
        updatedAt: serverTimestamp(),
      });
      
      const baseUrl = meMode === 'sandbox' 
        ? 'https://sandbox.melhorenvio.com.br/oauth/authorize' 
        : 'https://melhorenvio.com.br/oauth/authorize';
      
      const redirectUri = window.location.origin.includes('localhost') || window.location.origin.includes('run.app')
        ? window.location.origin + '/'
        : 'https://dilermanoimport.netlify.app/';
      const scope = 'shipping-calculate';

      const authUrl = `${baseUrl}?client_id=${meClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
      
      const oauthUrl = authUrl;
      console.log("[MELHOR_ENVIO] OAuth URL:", oauthUrl);

      toast.loading('Redirecionando para o Melhor Envio...');
      window.location.href = authUrl;
    } catch (e) {
      toast.error('Falha ao registrar chaves antes de conectar');
      setSaving(false);
    }
  };

  const handleExportOrders = async () => {
    setExporting(true);
    try {
      const snap = await getDocs(collection(db, 'orders'));
      if (snap.empty) {
        toast.info('Não há pedidos a serem exportados.');
        return;
      }
      
      const ordersList = snap.docs.map(doc => {
        const data = doc.data();
        const sanitizedData: any = { ...data, id: doc.id };
        for (const key in sanitizedData) {
          if (sanitizedData[key] && typeof sanitizedData[key].toDate === 'function') {
            sanitizedData[key] = sanitizedData[key].toDate().toISOString();
          }
        }
        if (Array.isArray(sanitizedData.trackingEvents)) {
          sanitizedData.trackingEvents = sanitizedData.trackingEvents.map((ev: any) => {
            const sanitizedEv = { ...ev };
            for (const k in sanitizedEv) {
              if (sanitizedEv[k] && typeof sanitizedEv[k].toDate === 'function') {
                sanitizedEv[k] = sanitizedEv[k].toDate().toISOString();
              }
            }
            return sanitizedEv;
          });
        }
        return sanitizedData;
      });

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(ordersList, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `pedidos_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      toast.success('Pedidos exportados em formato JSON para download local!');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao exportar pedidos: ' + (e?.message || ''));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteOrders = async () => {
    if (confirmText !== 'APAGAR PEDIDOS') {
      toast.error('Por favor, digite o texto de confirmação exatamente como solicitado.');
      return;
    }

    setIsDeleting(true);
    try {
      const ordersRef = collection(db, 'orders');
      const snap = await getDocs(ordersRef);

      if (snap.empty) {
        toast.info('Nenhum pedido de teste encontrado na coleção "orders".');
        setIsConfirmModalOpen(false);
        setConfirmText('');
        return;
      }

      const docs = snap.docs;
      const chunks = [];
      const chunkSize = 500;
      for (let i = 0; i < docs.length; i += chunkSize) {
        chunks.push(docs.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((document) => {
          batch.delete(doc(db, 'orders', document.id));
        });
        await batch.commit();
      }
      toast.success('Todos os pedidos de teste foram apagados com sucesso!');
      setConfirmText('');
      setIsConfirmModalOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao apagar pedidos de teste: ' + (e?.message || ''));
    } finally {
      setIsDeleting(false);
    }
  };

  const resolvePlaceholders = (text: string, value: number | '', installments: number | '') => {
    if (!text) return '';
    let result = text;
    if (value !== '') {
      const formattedVal = typeof value === 'number' 
        ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) 
        : String(value);
      result = result.replace(/\{valor\}/g, formattedVal);
    } else {
      result = result.replace(/\{valor\}/g, '');
    }
    if (installments !== '') {
      result = result.replace(/\{parcelas\}/g, `${installments}x`);
    } else {
      result = result.replace(/\{parcelas\}/g, '');
    }
    return result;
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Configurações Gerais
        </button>
        <button
          onClick={() => setActiveTab('promocta')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'promocta'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Banner Promocional (CTA)
        </button>
        <button
          onClick={() => setActiveTab('melhorenvio')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'melhorenvio'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Frete (Melhor Envio)
        </button>
      </div>

      {loading || connecting ? (
        <div className="text-center py-20 text-slate-400 font-semibold text-sm flex flex-col items-center gap-2 justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span>{connecting ? 'Trocar códigos do Melhor Envio...' : 'Acessando as preferências da loja...'}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Card Config Geral */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Store className="h-4.5 w-4.5 text-blue-500" /> Perfil da Loja
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Nome fantasia de sua marca nos cabeçalhos e correspondências.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="pref-storeName" className="text-xs font-semibold text-slate-700">Nome Fantasia da Loja</Label>
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
                    <Phone className="h-4.5 w-4.5 text-green-500" /> Atendimento e Suporte
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Suas fontes de contato telefônico e WhatsApp da loja.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
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
                    Chave PIX exibida na conclusão de compra para os compradores.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
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
                    Endereço disponível para compradores que escolherem retirar no local.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
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

              {/* Tool for Cleaning Test Orders */}
              {authIsAdmin && (
                <Card className="rounded-2xl border-2 border-rose-100 bg-rose-50/20 shadow-none p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                        Limpeza de Pedidos de Teste
                      </h3>
                      <p className="text-xs text-slate-550">
                        Ferramenta temporária para remover pedidos criados durante os testes da loja.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                    <Button 
                      type="button"
                      onClick={handleExportOrders}
                      disabled={exporting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-5 text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <Download className="h-4 w-4" />
                      {exporting ? 'Exportando...' : 'Exportar Pedidos (JSON)'}
                    </Button>

                    <Button 
                      type="button"
                      variant="destructive"
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-10 px-5 text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      Apagar Todos os Pedidos
                    </Button>
                  </div>
                </Card>
              )}

              {/* Form Confirm Bar */}
              <div className="flex justify-end pt-4">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-8 cursor-pointer shadow-lg shadow-blue-500/10"
                  onClick={handleSaveGeneral}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'promocta' && (
            <div className="space-y-6">
              {/* Card Banner Promocional CTA */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Megaphone className="h-4.5 w-4.5 text-blue-500" /> Banner Promocional (CTA)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Controle o banner promocional exibido na página inicial imediatamente antes do rodapé.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Switch Active */}
                  <div className="flex items-center space-x-3 h-12 bg-slate-50 border border-slate-150 p-4 rounded-xl shadow-sm">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        id="cta-active"
                        type="checkbox" 
                        checked={ctaActive} 
                        onChange={(e) => setCtaActive(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-xs font-bold text-slate-700">Ativar Banner na Home</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-title" className="text-xs font-semibold text-slate-700">Título *</Label>
                      <Input 
                        id="cta-title" 
                        value={ctaTitle} 
                        onChange={(e) => setCtaTitle(e.target.value)}
                        placeholder="Ex: Frete Grátis acima de R$ {valor}"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                        required
                      />
                      <p className="text-[10px] text-slate-400">Use <code className="font-mono bg-slate-100 px-1 rounded">{`{valor}`}</code> para exibir o valor dinamicamente.</p>
                    </div>

                    {/* Value */}
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-value" className="text-xs font-semibold text-slate-700">Valor (R$)</Label>
                      <Input 
                        id="cta-value" 
                        type="number" 
                        value={ctaValue} 
                        onChange={(e) => setCtaValue(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 50"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                      />
                      <p className="text-[10px] text-slate-400">Gera o formato R$ e substitui o placeholder.</p>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cta-subtitle" className="text-xs font-semibold text-slate-700">Subtítulo</Label>
                    <textarea 
                      id="cta-subtitle" 
                      rows={3}
                      value={ctaSubtitle} 
                      onChange={(e) => setCtaSubtitle(e.target.value)}
                      placeholder="Ex: Aproveite condições especiais em toda a loja. Parcele em até {parcelas} sem juros."
                      className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans" 
                    />
                    <p className="text-[10px] text-slate-400">Use <code className="font-mono bg-slate-100 px-1 rounded">{`{parcelas}`}</code> para exibir o número de parcelas dinamicamente.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Installments */}
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-installments" className="text-xs font-semibold text-slate-705">Número de Parcelas</Label>
                      <Input 
                        id="cta-installments" 
                        type="number" 
                        value={ctaInstallments} 
                        onChange={(e) => setCtaInstallments(e.target.value === '' ? '' : Math.floor(Number(e.target.value)))}
                        placeholder="Ex: 5"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                      />
                    </div>

                    {/* Button Text */}
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-btn-text" className="text-xs font-semibold text-slate-705">Texto do Botão</Label>
                      <Input 
                        id="cta-btn-text" 
                        value={ctaButtonText} 
                        onChange={(e) => setCtaButtonText(e.target.value)}
                        placeholder="Ex: Comprar Agora"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                      />
                    </div>

                    {/* Button Link */}
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-btn-link" className="text-xs font-semibold text-slate-705">Link do Botão</Label>
                      <Input 
                        id="cta-btn-link" 
                        value={ctaButtonLink} 
                        onChange={(e) => setCtaButtonLink(e.target.value)}
                        placeholder="Ex: /categoria/novidades"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                      />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-bgcolor" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5" /> Cor de Fundo
                      </Label>
                      <div className="flex gap-2">
                        <input 
                          id="cta-bgcolor" 
                          type="color" 
                          value={ctaBgColor} 
                          onChange={(e) => setCtaBgColor(e.target.value)}
                          className="w-12 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0" 
                        />
                        <Input 
                          id="cta-bgcolor-hex" 
                          value={ctaBgColor} 
                          onChange={(e) => setCtaBgColor(e.target.value)}
                          className="rounded-xl border-slate-200 h-10 bg-white font-mono uppercase" 
                          maxLength={7}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="cta-textcolor" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5" /> Cor do Texto
                      </Label>
                      <div className="flex gap-2">
                        <input 
                          id="cta-textcolor" 
                          type="color" 
                          value={ctaTextColor} 
                          onChange={(e) => setCtaTextColor(e.target.value)}
                          className="w-12 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0" 
                        />
                        <Input 
                          id="cta-textcolor-hex" 
                          value={ctaTextColor} 
                          onChange={(e) => setCtaTextColor(e.target.value)}
                          className="rounded-xl border-slate-200 h-10 bg-white font-mono uppercase" 
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="border border-dashed border-slate-300 rounded-3xl p-4 bg-slate-50/50 mt-4">
                    <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-slate-400" /> Pré-visualização do Banner (Tempo Real)
                    </p>
                    
                    {ctaActive ? (
                      <div 
                        className="rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
                        style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
                      >
                        <div className="relative z-10 max-w-md space-y-4 text-left">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                            OFERTA ESPECIAL
                          </span>
                          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                            {resolvePlaceholders(ctaTitle, ctaValue, ctaInstallments) || 'Sem Título'}
                          </h2>
                          <p className="text-xs opacity-90 whitespace-pre-line leading-relaxed">
                            {resolvePlaceholders(ctaSubtitle, ctaValue, ctaInstallments) || 'Sem Subtítulo'}
                          </p>
                          <button 
                            disabled 
                            className="font-bold text-xs h-10 px-6 rounded-lg bg-white shadow-md cursor-not-allowed uppercase"
                            style={{ backgroundColor: ctaTextColor, color: ctaBgColor }}
                          >
                            {ctaButtonText || 'Comprar Agora'}
                          </button>
                        </div>
                        <div className="relative z-10 w-24 md:w-32 aspect-square shrink-0">
                           <img 
                             src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
                             alt="Oferta Especial" 
                             className="rounded-2xl shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500 w-full h-full object-cover"
                           />
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-[2rem] p-8 text-center text-slate-400 bg-white">
                        <p className="text-xs font-semibold">O Banner Promocional está desativado.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Habilite "Ativar Banner na Home" acima para pré-visualizar e exibir o banner.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Form Confirm Bar */}
              <div className="flex justify-between pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl h-11 px-6 cursor-pointer"
                  onClick={handleRestorePromoDefaults}
                >
                  Restaurar Padrão
                </Button>

                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-8 cursor-pointer shadow-lg shadow-blue-500/10"
                  onClick={handleSavePromoCTA}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'melhorenvio' && (
            <div className="space-y-6">
              {/* Status Section */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {meConnected ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Status da Conexão</h3>
                        <p className="text-sm text-slate-500 font-semibold text-amber-600 mt-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          ⚠️ Modo de Simulação Local Ativo: O checkout e a página de produto estão calculando frete offline com tabelas locais de CEPs.
                        </p>
                        {meConnected && meExpiresAt && (
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            Token válido até: {new Date(meExpiresAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        meConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {meConnected ? 'Ativo / Conectado' : 'Sem Conexão'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Fields */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="h-4.5 w-4.5 text-blue-500" /> Configuração Melhor Envio
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Insira as chaves extraídas do Portal do Desenvolvedor do Melhor Envio e realize a conexão OAuth.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="me-clientId" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Key className="h-3.5 w-3.5 text-slate-400" /> Client ID
                      </Label>
                      <Input 
                        id="me-clientId" 
                        placeholder="Ex: 1234"
                        value={meClientId} 
                        onChange={(e) => setMeClientId(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 bg-white font-mono" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="me-clientSecret" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Key className="h-3.5 w-3.5 text-slate-400" /> Client Secret
                      </Label>
                      <Input 
                        id="me-clientSecret" 
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        value={meClientSecret} 
                        onChange={(e) => setMeClientSecret(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 bg-white font-mono" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="me-originZip" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> CEP de Origem (Remetente)
                      </Label>
                      <Input 
                        id="me-originZip" 
                        placeholder="00000-000"
                        value={meOriginZip} 
                        onChange={(e) => setMeOriginZip(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 bg-white font-mono" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="me-mode" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-slate-400" /> Ambiente do Serviço
                      </Label>
                      <select
                        id="me-mode"
                        value={meMode}
                        onChange={(e) => setMeMode(e.target.value as 'sandbox' | 'production')}
                        className="w-full rounded-xl border border-slate-200 h-10 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sandbox">Sandbox (Testes / Homologação)</option>
                        <option value="production">Produção (Operação Real)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
                <Button 
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl h-11 px-6 cursor-pointer"
                  onClick={handleSaveMelhorEnvio}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" /> Salvar Configurações
                </Button>

                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-8 cursor-pointer shadow-lg shadow-blue-500/10"
                  onClick={handleConnectMelhorEnvio}
                  disabled={saving || connecting}
                >
                  <RefreshCw className={`h-4 w-4 ${connecting ? 'animate-spin' : ''}`} /> 
                  Conectar ao Melhor Envio
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Test Orders Clean-up */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-150">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />
              <span>⚠️ Atenção</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-700 font-semibold bg-rose-50 p-4 rounded-xl border border-rose-100 leading-relaxed">
              Esta ação removerá permanentemente todos os pedidos cadastrados na coleção orders. Esta operação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4 text-xs font-medium">
            <p className="text-slate-600">
              Para prosseguir e confirmar esta exclusão, digite exatamente as palavras abaixo no campo de segurança:
            </p>
            <div className="bg-slate-50 border border-slate-150 py-2 rounded-xl text-center select-none">
              <span className="font-mono font-black text-rose-600 text-sm tracking-wider uppercase">
                APAGAR PEDIDOS
              </span>
            </div>
            
            <div className="space-y-1.5 focus-within:text-blue-500 text-slate-500">
              <Label htmlFor="sec-input" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Código de Confirmação</Label>
              <Input 
                id="sec-input"
                autoComplete="off"
                placeholder="Digite APAGAR PEDIDOS"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-11 bg-white border-slate-200 rounded-xl font-mono text-center uppercase tracking-wide placeholder:font-sans placeholder:normal-case font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 sm:flex-row flex-col border-t border-slate-100 pt-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setIsConfirmModalOpen(false);
                setConfirmText('');
              }} 
              disabled={isDeleting}
              className="rounded-xl h-11 border-slate-200 hover:bg-slate-50 flex-1 text-slate-600 font-bold text-xs"
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteOrders}
              disabled={confirmText !== 'APAGAR PEDIDOS' || isDeleting}
              className="rounded-xl h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold flex-1 text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Apagando...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
