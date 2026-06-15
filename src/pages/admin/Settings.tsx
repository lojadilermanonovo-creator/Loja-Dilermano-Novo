import { useEffect, useState } from 'react';
import { db, functions } from '@/src/integrations/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Settings, Save, Phone, QrCode, MapPin, Store, 
  Globe, Key, RefreshCw, AlertCircle, CheckCircle2, Truck 
} from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'melhorenvio'>('general');

  // States for general config
  const [storeName, setStoreName] = useState('Dilermando Store');
  const [whatsapp, setWhatsapp] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  // States for Melhor Envio
  const [meClientId, setMeClientId] = useState('');
  const [meClientSecret, setMeClientSecret] = useState('');
  const [meOriginZip, setMeOriginZip] = useState('');
  const [meMode, setMeMode] = useState<'sandbox' | 'production'>('sandbox');
  const [meConnected, setMeConnected] = useState(false);
  const [meExpiresAt, setMeExpiresAt] = useState<number | null>(null);

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
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Configurações Gerais
        </button>
        <button
          onClick={() => setActiveTab('melhorenvio')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 ${
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
          {activeTab === 'general' ? (
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
          ) : (
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
                        <p className="text-sm text-slate-500">
                          {meConnected 
                            ? 'O sistema está conectado com sucesso ao Melhor Envio. As consultas reais ao frete estão ativas!' 
                            : 'O sistema ainda não está autenticado com o Melhor Envio. Configure as chaves abaixo e conecte.'}
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
    </div>
  );
}
