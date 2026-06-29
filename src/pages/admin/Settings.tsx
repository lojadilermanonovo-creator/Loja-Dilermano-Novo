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
  Megaphone, Palette, Trash2, AlertTriangle, Download,
  MessageSquare, Mail, Link2, Clock, Sparkles, Eye, X, CreditCard
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import ImageUploader from '@/src/components/admin/ImageUploader';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';

export default function AdminSettings() {
  const { isAdmin: authIsAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'melhorenvio' | 'popup' | 'footer' | 'stripe'>('general');

  // States for Stripe config
  const [stripeActive, setStripeActive] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeMode, setStripeMode] = useState<'sandbox' | 'production'>('sandbox');

  // States for general config
  const [storeName, setStoreName] = useState('Dilermano Store');
  const [adminBrandName, setAdminBrandName] = useState('Dilermando');
  const [whatsapp, setWhatsapp] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixQrCodeUrl, setPixQrCodeUrl] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  // States for Footer config
  const [footerStoreName, setFooterStoreName] = useState('DILERMANO');
  const [footerInstText, setFooterInstText] = useState('Estilo e qualidade para quem busca o melhor do vestuário.');
  const [footerInstagram, setFooterInstagram] = useState('https://instagram.com/dilermano.oficial');
  const [footerEmail, setFooterEmail] = useState('dilermano3535@gmail.com');
  const [footerPhone, setFooterPhone] = useState('(91) 98399-7964');
  const [footerAddress, setFooterAddress] = useState('Rua Primeiro de Maio, 371\nBairro Centro - Abaetetuba/PA');
  const [footerRazaoSocial, setFooterRazaoSocial] = useState('D S DO CARMO COMERCIO DE VESTUARIO');
  const [footerCnpj, setFooterCnpj] = useState('51.178.777/0001-81');
  const [footerLinksTitle, setFooterLinksTitle] = useState('Links Úteis');
  const [footerContactTitle, setFooterContactTitle] = useState('Central de Atendimento');
  const [footerCompanyTitle, setFooterCompanyTitle] = useState('Empresa');

  // Interactive Links (Footer Link texts & urls represent independent clean state fields to maximize UI stability)
  const [footerLink1Text, setFooterLink1Text] = useState('Perguntas Frequentes');
  const [footerLink1Url, setFooterLink1Url] = useState('/faq');
  const [footerLink2Text, setFooterLink2Text] = useState('Política de Privacidade');
  const [footerLink2Url, setFooterLink2Url] = useState('/politica-de-privacidade');
  const [footerLink3Text, setFooterLink3Text] = useState('Termos de Uso');
  const [footerLink3Url, setFooterLink3Url] = useState('/termos-de-uso');
  const [footerLink4Text, setFooterLink4Text] = useState('Trocas e Devoluções');
  const [footerLink4Url, setFooterLink4Url] = useState('/trocas-e-devolucoes');
  const [footerLink5Text, setFooterLink5Text] = useState('');
  const [footerLink5Url, setFooterLink5Url] = useState('');

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

  // States for Popup
  const [popupActive, setPopupActive] = useState(false);
  const [popupTitle, setPopupTitle] = useState('Novidades & Ofertas');
  const [popupText, setPopupText] = useState('Inscreva-se em nossa newsletter ou entre em contato para receber cupons exclusivos!');
  const [popupImageUrl, setPopupImageUrl] = useState('');
  const [popupButtonText, setPopupButtonText] = useState('Falar no WhatsApp');
  const [popupButtonAction, setPopupButtonAction] = useState<'whatsapp' | 'email' | 'link'>('whatsapp');
  const [popupButtonDestination, setPopupButtonDestination] = useState('');
  const [popupDelaySeconds, setPopupDelaySeconds] = useState<number>(5);
  const [popupOncePerVisitor, setPopupOncePerVisitor] = useState(true);
  const [popupLayout, setPopupLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [popupBgColor, setPopupBgColor] = useState('#FFFFFF');
  const [popupTitleColor, setPopupTitleColor] = useState('#0F172A');
  const [popupTextColor, setPopupTextColor] = useState('#475569');
  const [popupBtnBgColor, setPopupBtnBgColor] = useState('#2563EB');
  const [popupBtnTextColor, setPopupBtnTextColor] = useState('#FFFFFF');

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
        setStoreName(data.storeName || 'Dilermano Store');
        setAdminBrandName(data.adminBrandName || 'Dilermando');
        setWhatsapp(data.whatsapp || '');
        setPixKey(data.pixKey || '');
        setPixQrCodeUrl(data.pixQrCodeUrl || '');
        setPickupAddress(data.pickupAddress || '');
      } else {
        await setDoc(doc(db, 'settings', 'general'), {
          storeName: 'Dilermano Store',
          adminBrandName: 'Dilermando',
          whatsapp: '',
          pixKey: '',
          pixQrCodeUrl: '',
          pickupAddress: '',
          createdAt: serverTimestamp(),
        });
      }

      // 1b. Footer Config
      const footerSnap = await getDoc(doc(db, 'settings', 'footer'));
      if (footerSnap.exists()) {
        const data = footerSnap.data();
        setFooterStoreName(data.storeName || 'DILERMANO');
        setFooterInstText(data.institutionalText || 'Estilo e qualidade para quem busca o melhor do vestuário.');
        setFooterInstagram(data.instagramUrl || 'https://instagram.com/dilermano.oficial');
        setFooterEmail(data.email || 'dilermano3535@gmail.com');
        setFooterPhone(data.phone || '(91) 98399-7964');
        setFooterAddress(data.address || 'Rua Primeiro de Maio, 371\nBairro Centro - Abaetetuba/PA');
        setFooterRazaoSocial(data.razaoSocial || 'D S DO CARMO COMERCIO DE VESTUARIO');
        setFooterCnpj(data.cnpj || '51.178.777/0001-81');
        setFooterLinksTitle(data.linksTitle || 'Links Úteis');
        setFooterContactTitle(data.contactTitle || 'Central de Atendimento');
        setFooterCompanyTitle(data.companyTitle || 'Empresa');
        
        const lks = data.links || [];
        setFooterLink1Text(lks[0]?.text || 'Perguntas Frequentes');
        setFooterLink1Url(lks[0]?.url || '/faq');
        setFooterLink2Text(lks[1]?.text || 'Política de Privacidade');
        setFooterLink2Url(lks[1]?.url || '/politica-de-privacidade');
        setFooterLink3Text(lks[2]?.text || 'Termos de Uso');
        setFooterLink3Url(lks[2]?.url || '/termos-de-uso');
        setFooterLink4Text(lks[3]?.text || 'Trocas e Devoluções');
        setFooterLink4Url(lks[3]?.url || '/trocas-e-devolucoes');
        setFooterLink5Text(lks[4]?.text || '');
        setFooterLink5Url(lks[4]?.url || '');
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

      // 5. Popup Settings
      const popupSnap = await getDoc(doc(db, 'settings', 'popup'));
      if (popupSnap.exists()) {
        const data = popupSnap.data();
        setPopupActive(data.active !== undefined ? data.active : false);
        setPopupTitle(data.title || 'Novidades & Ofertas');
        setPopupText(data.text || '');
        setPopupImageUrl(data.imageUrl || '');
        setPopupButtonText(data.buttonText || 'Falar no WhatsApp');
        setPopupButtonAction(data.buttonAction || 'whatsapp');
        setPopupButtonDestination(data.buttonDestination || '');
        setPopupDelaySeconds(data.delaySeconds !== undefined ? Number(data.delaySeconds) : 5);
        setPopupOncePerVisitor(data.oncePerVisitor !== undefined ? data.oncePerVisitor : true);
        setPopupLayout(data.layout || 'horizontal');
        setPopupBgColor(data.bgColor || '#FFFFFF');
        setPopupTitleColor(data.titleColor || '#0F172A');
        setPopupTextColor(data.textColor || '#475569');
        setPopupBtnBgColor(data.btnBgColor || '#2563EB');
        setPopupBtnTextColor(data.btnTextColor || '#FFFFFF');
      } else {
        setPopupActive(false);
        setPopupTitle('Novidades & Ofertas');
        setPopupText('Inscreva-se em nossa newsletter ou entre em contato para receber cupons exclusivos!');
        setPopupImageUrl('');
        setPopupButtonText('Falar no WhatsApp');
        setPopupButtonAction('whatsapp');
        setPopupButtonDestination('');
        setPopupDelaySeconds(5);
        setPopupOncePerVisitor(true);
        setPopupLayout('horizontal');
        setPopupBgColor('#FFFFFF');
        setPopupTitleColor('#0F172A');
        setPopupTextColor('#475569');
        setPopupBtnBgColor('#2563EB');
        setPopupBtnTextColor('#FFFFFF');
      }

      // 6. Stripe Settings
      const stripeSnap = await getDoc(doc(db, 'settings', 'stripe'));
      if (stripeSnap.exists()) {
        const data = stripeSnap.data();
        setStripeActive(data.active !== undefined ? data.active : false);
        setStripePublishableKey(data.publishableKey || '');
        setStripeSecretKey(data.secretKey || '');
        setStripeMode(data.mode || 'sandbox');
      } else {
        setStripeActive(false);
        setStripePublishableKey('');
        setStripeSecretKey('');
        setStripeMode('sandbox');
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
        adminBrandName,
        whatsapp,
        pixKey,
        pixQrCodeUrl,
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

  const handleSaveFooter = async () => {
    setSaving(true);
    try {
      // Assemble structured links list keeping only those with at least a URL or text
      const links = [];
      if (footerLink1Text || footerLink1Url) links.push({ text: footerLink1Text, url: footerLink1Url });
      if (footerLink2Text || footerLink2Url) links.push({ text: footerLink2Text, url: footerLink2Url });
      if (footerLink3Text || footerLink3Url) links.push({ text: footerLink3Text, url: footerLink3Url });
      if (footerLink4Text || footerLink4Url) links.push({ text: footerLink4Text, url: footerLink4Url });
      if (footerLink5Text || footerLink5Url) links.push({ text: footerLink5Text, url: footerLink5Url });

      await setDoc(doc(db, 'settings', 'footer'), {
        storeName: footerStoreName,
        institutionalText: footerInstText,
        instagramUrl: footerInstagram,
        email: footerEmail,
        phone: footerPhone,
        address: footerAddress,
        razaoSocial: footerRazaoSocial,
        cnpj: footerCnpj,
        linksTitle: footerLinksTitle,
        contactTitle: footerContactTitle,
        companyTitle: footerCompanyTitle,
        links,
        updatedAt: serverTimestamp()
      });
      toast.success('Configurações do rodapé atualizadas com sucesso!');
    } catch (e) {
      toast.error('Erro ao salvar as configurações do rodapé');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePopup = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'popup'), {
        active: popupActive,
        title: popupTitle,
        text: popupText,
        imageUrl: popupImageUrl,
        buttonText: popupButtonText,
        buttonAction: popupButtonAction,
        buttonDestination: popupButtonDestination,
        delaySeconds: Number(popupDelaySeconds) || 5,
        oncePerVisitor: popupOncePerVisitor,
        layout: popupLayout,
        bgColor: popupBgColor,
        titleColor: popupTitleColor,
        textColor: popupTextColor,
        btnBgColor: popupBtnBgColor,
        btnTextColor: popupBtnTextColor,
        updatedAt: serverTimestamp(),
      });
      toast.success('Configurações do Popup salvas com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar as configurações do Popup');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStripe = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'stripe'), {
        active: stripeActive,
        publishableKey: stripePublishableKey.trim(),
        secretKey: stripeSecretKey.trim(),
        mode: stripeMode,
        updatedAt: serverTimestamp(),
      });
      toast.success('Configurações do Stripe salvas com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar as configurações do Stripe');
    } finally {
      setSaving(false);
    }
  };

  const handleRestorePopupDefaults = () => {
    setPopupActive(false);
    setPopupTitle('Novidades & Ofertas');
    setPopupText('Inscreva-se em nossa newsletter ou entre em contato para receber cupons exclusivos!');
    setPopupImageUrl('');
    setPopupButtonText('Falar no WhatsApp');
    setPopupButtonAction('whatsapp');
    setPopupButtonDestination('');
    setPopupDelaySeconds(5);
    setPopupOncePerVisitor(true);
    setPopupLayout('horizontal');
    setPopupBgColor('#FFFFFF');
    setPopupTitleColor('#0F172A');
    setPopupTextColor('#475569');
    setPopupBtnBgColor('#2563EB');
    setPopupBtnTextColor('#FFFFFF');
    toast.info('Valores padrão do popup preenchidos. Clique em "Salvar Alterações" para gravar.');
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
            Modifique chaves e informações operacionais do e-commerce.
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
          onClick={() => setActiveTab('popup')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'popup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Popup's
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
        <button
          onClick={() => setActiveTab('footer')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'footer'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Rodapé (Footer)
        </button>
        <button
          onClick={() => setActiveTab('stripe')}
          className={`pb-3 text-sm font-extrabold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'stripe'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Pagamentos (Stripe)
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
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pref-storeName" className="text-xs font-semibold text-slate-700">Nome Fantasia da Loja</Label>
                    <Input 
                      id="pref-storeName" 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)}
                      className="rounded-xl border-slate-200 h-10 bg-white" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pref-adminBrandName" className="text-xs font-semibold text-slate-700">Nome da Empresa (Painel Administrativo)</Label>
                    <Input 
                      id="pref-adminBrandName" 
                      value={adminBrandName} 
                      onChange={(e) => setAdminBrandName(e.target.value)}
                      className="rounded-xl border-slate-200 h-10 bg-white" 
                      placeholder="Dilermando"
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

                  <div className="pt-4 border-t border-slate-100">
                    <ImageUploader
                      value={pixQrCodeUrl}
                      onChange={setPixQrCodeUrl}
                      folder="settings"
                      label="QR Code PIX Personalizado (Upload Opcional)"
                      placeholder="Cole a URL ou faça upload da imagem do seu QR Code PIX"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Se você enviar uma imagem de QR Code PIX, ela será mostrada na página de sucesso do pedido no checkout. Caso contrário, a tela gerará um QR Code automaticamente a partir da chave PIX acima.
                    </p>
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

          {activeTab === 'popup' && (
            <div className="space-y-6">
              {/* Card Popup Settings */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-blue-500" /> Popup Promocional
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure um popup moderno e responsivo para engajar os clientes ao acessarem a loja.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Switch Active */}
                  <div className="flex items-center space-x-3 h-12 bg-slate-50 border border-slate-150 p-4 rounded-xl shadow-sm">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        id="popup-active"
                        type="checkbox" 
                        checked={popupActive} 
                        onChange={(e) => setPopupActive(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-xs font-bold text-slate-700">Ativar Popup na Loja</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor="popup-title" className="text-xs font-semibold text-slate-700">Título do Popup *</Label>
                      <Input 
                        id="popup-title" 
                        value={popupTitle} 
                        onChange={(e) => setPopupTitle(e.target.value)}
                        placeholder="Ex: Cupom de 10% Off!"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                        required
                      />
                    </div>

                    {/* Layout Option */}
                    <div className="space-y-1.5">
                      <Label htmlFor="popup-layout" className="text-xs font-semibold text-slate-700">Modelo do Layout *</Label>
                      <select
                        id="popup-layout"
                        value={popupLayout}
                        onChange={(e) => setPopupLayout(e.target.value as 'horizontal' | 'vertical')}
                        className="w-full rounded-xl border border-slate-200 h-10 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      >
                        <option value="horizontal">Horizontal (atual)</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </div>

                    {/* Delay Option */}
                    <div className="space-y-1.5">
                      <Label htmlFor="popup-delay" className="text-xs font-semibold text-slate-700">Espera para Aparecer (segundos)</Label>
                      <Input 
                        id="popup-delay" 
                        type="number" 
                        min={1}
                        value={popupDelaySeconds} 
                        onChange={(e) => setPopupDelaySeconds(Number(e.target.value) || 5)}
                        placeholder="Ex: 5"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                      />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-text" className="text-xs font-semibold text-slate-700">Texto / Mensagem do Popup</Label>
                    <textarea 
                      id="popup-text" 
                      rows={3}
                      value={popupText} 
                      onChange={(e) => setPopupText(e.target.value)}
                      placeholder="Ex: Cadastre-se ou fale conosco agora para garantir desconto exclusivo em sua primeira compra!"
                      className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans" 
                    />
                  </div>

                  {/* Image Uploader */}
                  <div className="pt-4 border-t border-slate-100">
                    <ImageUploader
                      value={popupImageUrl}
                      onChange={setPopupImageUrl}
                      folder="settings"
                      label="Imagem do Popup (Opcional - Proporção de Banner Recomendada)"
                      placeholder="Cole a URL ou envie uma imagem"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Se você enviar uma imagem, ela será exibida no lado esquerdo do popup em telas maiores e no topo em celulares. Caso contrário, o popup exibirá um layout limpo focado no texto.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    {/* Button Text */}
                    <div className="space-y-1.5">
                      <Label htmlFor="popup-btn-text" className="text-xs font-semibold text-slate-700">Texto do Botão de Ação</Label>
                      <Input 
                        id="popup-btn-text" 
                        value={popupButtonText} 
                        onChange={(e) => setPopupButtonText(e.target.value)}
                        placeholder="Ex: Garantir Meu Desconto"
                        className="rounded-xl border-slate-200 h-10 bg-white" 
                      />
                    </div>

                    {/* Button Action Type */}
                    <div className="space-y-1.5">
                      <Label htmlFor="popup-btn-action" className="text-xs font-semibold text-slate-700">Ação do Botão</Label>
                      <select
                        id="popup-btn-action"
                        value={popupButtonAction}
                        onChange={(e) => setPopupButtonAction(e.target.value as 'whatsapp' | 'email' | 'link')}
                        className="w-full rounded-xl border border-slate-200 h-10 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      >
                        <option value="whatsapp">Falar no WhatsApp</option>
                        <option value="email">Enviar E-mail</option>
                        <option value="link">Link Personalizado / Página do Site</option>
                      </select>
                    </div>
                  </div>

                  {/* Button Destination */}
                  <div className="space-y-1.5">
                    <Label htmlFor="popup-btn-dest" className="text-xs font-semibold text-slate-700">
                      {popupButtonAction === 'whatsapp' && 'Número de Celular para WhatsApp (Ex: +5543999998888)'}
                      {popupButtonAction === 'email' && 'E-mail de Destino'}
                      {popupButtonAction === 'link' && 'Link ou URL de Destino (Ex: /categoria/promocoes ou https://dilermano.com)'}
                    </Label>
                    <Input 
                      id="popup-btn-dest" 
                      value={popupButtonDestination} 
                      onChange={(e) => setPopupButtonDestination(e.target.value)}
                      placeholder={
                        popupButtonAction === 'whatsapp' 
                          ? '+5543999998888' 
                          : popupButtonAction === 'email' 
                          ? 'contato@dilermano.com' 
                          : '/categoria/promocoes'
                      }
                      className="rounded-xl border-slate-200 h-10 bg-white font-mono" 
                    />
                  </div>

                  {/* Switch Once Per Visitor */}
                  <div className="flex items-center space-x-3 h-12 bg-slate-50 border border-slate-150 p-4 rounded-xl shadow-sm">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        id="popup-once"
                        type="checkbox" 
                        checked={popupOncePerVisitor} 
                        onChange={(e) => setPopupOncePerVisitor(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-xs font-bold text-slate-700">Exibir apenas uma vez por visitante</span>
                    </label>
                  </div>

                  {/* Colors Customization */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Palette className="h-3.5 w-3.5 text-blue-500" /> Personalização de Cores do Popup
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* BG Color */}
                      <div className="space-y-1.5">
                        <Label htmlFor="popup-bgcolor" className="text-[10px] font-semibold text-slate-500">Cor de Fundo</Label>
                        <div className="flex gap-1.5">
                          <input 
                            id="popup-bgcolor" 
                            type="color" 
                            value={popupBgColor} 
                            onChange={(e) => setPopupBgColor(e.target.value)}
                            className="w-8 h-8 border border-slate-200 rounded-lg cursor-pointer bg-transparent p-0 shrink-0" 
                          />
                          <Input 
                            id="popup-bgcolor-hex" 
                            value={popupBgColor} 
                            onChange={(e) => setPopupBgColor(e.target.value)}
                            className="rounded-lg border-slate-200 h-8 bg-white font-mono uppercase text-xs p-1" 
                            maxLength={7}
                          />
                        </div>
                      </div>

                      {/* Title Color */}
                      <div className="space-y-1.5">
                        <Label htmlFor="popup-titlecolor" className="text-[10px] font-semibold text-slate-500">Cor do Título</Label>
                        <div className="flex gap-1.5">
                          <input 
                            id="popup-titlecolor" 
                            type="color" 
                            value={popupTitleColor} 
                            onChange={(e) => setPopupTitleColor(e.target.value)}
                            className="w-8 h-8 border border-slate-200 rounded-lg cursor-pointer bg-transparent p-0 shrink-0" 
                          />
                          <Input 
                            id="popup-titlecolor-hex" 
                            value={popupTitleColor} 
                            onChange={(e) => setPopupTitleColor(e.target.value)}
                            className="rounded-lg border-slate-200 h-8 bg-white font-mono uppercase text-xs p-1" 
                            maxLength={7}
                          />
                        </div>
                      </div>

                      {/* Text Color */}
                      <div className="space-y-1.5">
                        <Label htmlFor="popup-textcolor" className="text-[10px] font-semibold text-slate-500">Cor do Texto</Label>
                        <div className="flex gap-1.5">
                          <input 
                            id="popup-textcolor" 
                            type="color" 
                            value={popupTextColor} 
                            onChange={(e) => setPopupTextColor(e.target.value)}
                            className="w-8 h-8 border border-slate-200 rounded-lg cursor-pointer bg-transparent p-0 shrink-0" 
                          />
                          <Input 
                            id="popup-textcolor-hex" 
                            value={popupTextColor} 
                            onChange={(e) => setPopupTextColor(e.target.value)}
                            className="rounded-lg border-slate-200 h-8 bg-white font-mono uppercase text-xs p-1" 
                            maxLength={7}
                          />
                        </div>
                      </div>

                      {/* Button BG Color */}
                      <div className="space-y-1.5">
                        <Label htmlFor="popup-btnbgcolor" className="text-[10px] font-semibold text-slate-500">Fundo do Botão</Label>
                        <div className="flex gap-1.5">
                          <input 
                            id="popup-btnbgcolor" 
                            type="color" 
                            value={popupBtnBgColor} 
                            onChange={(e) => setPopupBtnBgColor(e.target.value)}
                            className="w-8 h-8 border border-slate-200 rounded-lg cursor-pointer bg-transparent p-0 shrink-0" 
                          />
                          <Input 
                            id="popup-btnbgcolor-hex" 
                            value={popupBtnBgColor} 
                            onChange={(e) => setPopupBtnBgColor(e.target.value)}
                            className="rounded-lg border-slate-200 h-8 bg-white font-mono uppercase text-xs p-1" 
                            maxLength={7}
                          />
                        </div>
                      </div>

                      {/* Button Text Color */}
                      <div className="space-y-1.5">
                        <Label htmlFor="popup-btntextcolor" className="text-[10px] font-semibold text-slate-500">Texto do Botão</Label>
                        <div className="flex gap-1.5">
                          <input 
                            id="popup-btntextcolor" 
                            type="color" 
                            value={popupBtnTextColor} 
                            onChange={(e) => setPopupBtnTextColor(e.target.value)}
                            className="w-8 h-8 border border-slate-200 rounded-lg cursor-pointer bg-transparent p-0 shrink-0" 
                          />
                          <Input 
                            id="popup-btntextcolor-hex" 
                            value={popupBtnTextColor} 
                            onChange={(e) => setPopupBtnTextColor(e.target.value)}
                            className="rounded-lg border-slate-200 h-8 bg-white font-mono uppercase text-xs p-1" 
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="border border-dashed border-slate-300 rounded-3xl p-4 bg-slate-50/50 mt-4">
                    <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-slate-400" /> Pré-visualização do Popup (Tempo Real)
                    </p>
                    
                    {popupActive ? (
                      <div className="flex items-center justify-center bg-slate-800/20 p-6 rounded-2xl border border-slate-200/50 min-h-[300px]">
                        <div 
                          className={`rounded-2xl overflow-hidden shadow-xl w-full border border-slate-100 relative ${
                            popupLayout === 'vertical' ? 'max-w-xs flex flex-col' : 'max-w-lg flex flex-col sm:flex-row'
                          }`}
                          style={{ backgroundColor: popupBgColor }}
                        >
                          <button disabled className="absolute top-3 right-3 bg-slate-150 text-slate-700 rounded-full p-1.5 opacity-80 cursor-not-allowed z-20">
                            <X className="h-3 w-3" />
                          </button>
                          
                          {popupImageUrl ? (
                            <div className={`${
                              popupLayout === 'vertical' ? 'w-full h-36' : 'sm:w-2/5 h-28 sm:h-auto'
                            } relative bg-slate-50 shrink-0 z-10`}>
                              <img 
                                src={popupImageUrl} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`${
                              popupLayout === 'vertical' ? 'w-full h-20 border-b' : 'hidden sm:flex sm:w-1/3 border-r'
                            } bg-slate-50/50 items-center justify-center border-slate-100 shrink-0 p-4 z-10`}>
                              <div className="text-center space-y-1 text-blue-500">
                                <Sparkles className="h-6 w-6 mx-auto animate-pulse" />
                              </div>
                            </div>
                          )}
                          
                          <div className="flex-1 p-6 flex flex-col justify-center space-y-4 text-left z-10">
                            <div className="space-y-1.5">
                              <span 
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                                style={{ backgroundColor: `${popupBtnBgColor}15`, color: popupBtnBgColor }}
                              >
                                <Sparkles className="h-2.5 w-2.5" /> Ativo
                              </span>
                              <h4 
                                className="text-base font-black tracking-tight leading-none uppercase"
                                style={{ color: popupTitleColor }}
                              >
                                {popupTitle || 'Sem Título'}
                              </h4>
                              {popupText && (
                                <p 
                                  className="text-xs font-semibold leading-relaxed whitespace-pre-line"
                                  style={{ color: popupTextColor }}
                                >
                                  {popupText}
                                </p>
                              )}
                            </div>
                            
                            <button 
                              disabled 
                              className="w-full font-black text-xs uppercase py-2.5 px-4 rounded-xl shadow-md cursor-not-allowed text-center transition-all"
                              style={{ backgroundColor: popupBtnBgColor, color: popupBtnTextColor }}
                            >
                              {popupButtonText || 'Garantir Benefício'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-[2rem] p-8 text-center text-slate-400 bg-white">
                        <p className="text-xs font-semibold">O Popup Promocional está desabilitado nas configurações.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Marque a opção "Ativar Popup na Loja" para pré-visualizar.</p>
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
                  onClick={handleRestorePopupDefaults}
                >
                  Restaurar Padrões
                </Button>

                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-8 cursor-pointer shadow-lg shadow-blue-500/10"
                  onClick={handleSavePopup}
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

          {activeTab === 'footer' && (
            <div className="space-y-6 animate-fade-in">
              {/* Card - Perfil do Rodapé */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Store className="h-4 w-4 text-blue-500" /> Perfil Institucional
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure os dados básicos de identificação da marca mostrados na primeira coluna.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-store" className="text-xs font-semibold text-slate-705">Nome Fantasia (Cabeçalho do rodapé)</Label>
                      <Input
                        id="foot-store"
                        value={footerStoreName}
                        onChange={(e) => setFooterStoreName(e.target.value)}
                        placeholder="Dilermano"
                        className="rounded-xl border-slate-200 h-10 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-insta" className="text-xs font-semibold text-slate-705">Link do Instagram</Label>
                      <Input
                        id="foot-insta"
                        value={footerInstagram}
                        onChange={(e) => setFooterInstagram(e.target.value)}
                        placeholder="https://instagram.com/..."
                        className="rounded-xl border-slate-200 h-10 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="foot-instText" className="text-xs font-semibold text-slate-705">Texto Institucional / Slogan curto</Label>
                    <textarea
                      id="foot-instText"
                      value={footerInstText}
                      onChange={(e) => setFooterInstText(e.target.value)}
                      placeholder="Descreva a identidade da sua loja de forma resumida..."
                      className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card - Atendimento e Endereço */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500" /> Contatos & Localização
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Endereços e canais de atendimento que aparecerão no rodapé.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-phone" className="text-xs font-semibold text-slate-705">Telefone de Atendimento</Label>
                      <Input
                        id="foot-phone"
                        value={footerPhone}
                        onChange={(e) => setFooterPhone(e.target.value)}
                        placeholder="(91) 98399-7964"
                        className="rounded-xl border-slate-200 h-10 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-email" className="text-xs font-semibold text-slate-705">E-mail Comercial</Label>
                      <Input
                        id="foot-email"
                        value={footerEmail}
                        onChange={(e) => setFooterEmail(e.target.value)}
                        placeholder="contato@dilermano.com.br"
                        className="rounded-xl border-slate-200 h-10 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="foot-address" className="text-xs font-semibold text-slate-705">Endereço Comercial</Label>
                    <textarea
                      id="foot-address"
                      value={footerAddress}
                      onChange={(e) => setFooterAddress(e.target.value)}
                      placeholder="Identificação do Logradouro, Número, Bairro, Cidade/Estado"
                      className="w-full rounded-xl border border-slate-200 p-3 bg-white text-sm focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card - Informações Empresa e CNPJ */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-500" /> Detalhes Legais (Empresa)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Razão Social e CNPJ exibidos para total transparência e conformidade legal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-razao" className="text-xs font-semibold text-slate-705">Razão Social</Label>
                      <Input
                        id="foot-razao"
                        value={footerRazaoSocial}
                        onChange={(e) => setFooterRazaoSocial(e.target.value)}
                        placeholder="D S DO CARMO COMERCIO..."
                        className="rounded-xl border-slate-200 h-10 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-cnpj" className="text-xs font-semibold text-slate-705">CNPJ</Label>
                      <Input
                        id="foot-cnpj"
                        value={footerCnpj}
                        onChange={(e) => setFooterCnpj(e.target.value)}
                        placeholder="51.178.777/0001-81"
                        className="rounded-xl border-slate-200 h-10 bg-white font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card - Títulos de Seções e Links Úteis */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="h-4 w-4 text-pink-500" /> Títulos & Links Internos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Altere os títulos das listas do rodapé e configure os links de navegação adicionais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Seção de Títulos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-lbl-links" className="text-xs font-semibold text-slate-707">Seção Coluna 2 (Links)</Label>
                      <Input
                        id="foot-lbl-links"
                        value={footerLinksTitle}
                        onChange={(e) => setFooterLinksTitle(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 bg-white font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-lbl-cont" className="text-xs font-semibold text-slate-707">Seção Coluna 3 (Contatos)</Label>
                      <Input
                        id="foot-lbl-cont"
                        value={footerContactTitle}
                        onChange={(e) => setFooterContactTitle(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 bg-white font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="foot-lbl-comp" className="text-xs font-semibold text-slate-707">Seção Coluna 4 (Empresa)</Label>
                      <Input
                        id="foot-lbl-comp"
                        value={footerCompanyTitle}
                        onChange={(e) => setFooterCompanyTitle(e.target.value)}
                        className="rounded-xl border-slate-200 h-10 bg-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Links Úteis Interativos */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Links de Navegação do Rodapé</h3>

                    <div className="space-y-3">
                      {/* Link 1 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Texto do Link 1</Label>
                          <Input
                            value={footerLink1Text}
                            onChange={(e) => setFooterLink1Text(e.target.value)}
                            placeholder="Ex: Perguntas Frequentes"
                            className="h-9 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Destino / Rota 1</Label>
                          <Input
                            value={footerLink1Url}
                            onChange={(e) => setFooterLink1Url(e.target.value)}
                            placeholder="Ex: /faq"
                            className="h-9 bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Link 2 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Texto do Link 2</Label>
                          <Input
                            value={footerLink2Text}
                            onChange={(e) => setFooterLink2Text(e.target.value)}
                            placeholder="Ex: Política de Privacidade"
                            className="h-9 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Destino / Rota 2</Label>
                          <Input
                            value={footerLink2Url}
                            onChange={(e) => setFooterLink2Url(e.target.value)}
                            placeholder="Ex: /politica"
                            className="h-9 bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Link 3 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Texto do Link 3</Label>
                          <Input
                            value={footerLink3Text}
                            onChange={(e) => setFooterLink3Text(e.target.value)}
                            placeholder="Ex: Termos de Uso"
                            className="h-9 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Destino / Rota 3</Label>
                          <Input
                            value={footerLink3Url}
                            onChange={(e) => setFooterLink3Url(e.target.value)}
                            placeholder="Ex: /termos-de-uso"
                            className="h-9 bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Link 4 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Texto do Link 4</Label>
                          <Input
                            value={footerLink4Text}
                            onChange={(e) => setFooterLink4Text(e.target.value)}
                            placeholder="Ex: Trocas e Devoluções"
                            className="h-9 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Destino / Rota 4</Label>
                          <Input
                            value={footerLink4Url}
                            onChange={(e) => setFooterLink4Url(e.target.value)}
                            placeholder="Ex: /trocas-e-devolucoes"
                            className="h-9 bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Link 5 (Extra) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 border rounded-xl">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Texto do Link 5 (Opcional)</Label>
                          <Input
                            value={footerLink5Text}
                            onChange={(e) => setFooterLink5Text(e.target.value)}
                            placeholder="Ex: Contato Direct"
                            className="h-9 bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Destino / Rota 5 (Opcional)</Label>
                          <Input
                            value={footerLink5Url}
                            onChange={(e) => setFooterLink5Url(e.target.value)}
                            placeholder="Ex: /contato"
                            className="h-9 bg-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Save Bar */}
              <div className="flex justify-end pt-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-8 cursor-pointer shadow-lg shadow-blue-500/10"
                  onClick={handleSaveFooter}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar Alterações do Rodapé'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'stripe' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-6">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" /> Configuração do Stripe Checkout
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Configure as credenciais e o ambiente de pagamento do Stripe para aceitar Cartão de Crédito de forma transparente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Switch */}
                    <div className="space-y-2">
                      <Label htmlFor="stripe-active" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                        Ativar Stripe
                      </Label>
                      <select
                        id="stripe-active"
                        value={stripeActive ? 'true' : 'false'}
                        onChange={(e) => setStripeActive(e.target.value === 'true')}
                        className="w-full rounded-xl border border-slate-200 h-10 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      >
                        <option value="false">Não (Inativo)</option>
                        <option value="true">Sim (Ativo)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Se ativado, os clientes poderão escolher "Cartão de Crédito (Stripe)" no Checkout.
                      </p>
                    </div>

                    {/* Environment Select */}
                    <div className="space-y-2">
                      <Label htmlFor="stripe-mode" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                        <Globe className="h-3.5 w-3.5 text-slate-400" /> Ambiente
                      </Label>
                      <select
                        id="stripe-mode"
                        value={stripeMode}
                        onChange={(e) => setStripeMode(e.target.value as 'sandbox' | 'production')}
                        className="w-full rounded-xl border border-slate-200 h-10 px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      >
                        <option value="sandbox">Sandbox / Teste</option>
                        <option value="production">Produção (Operação Real)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Sandbox para simulações e homologação. Produção para transações de cartão reais.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    {/* Publishable Key */}
                    <div className="space-y-1.5">
                      <Label htmlFor="stripe-pk" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                        <Key className="h-3.5 w-3.5 text-slate-400" /> Stripe Publishable Key (Chave Pública)
                      </Label>
                      <Input
                        id="stripe-pk"
                        type="text"
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        placeholder="Ex: pk_test_..."
                        className="h-10 bg-white text-sm font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Utilizada no front-end para inicializar o Stripe Elements ou redirecionamentos (geralmente começa com pk_test_ ou pk_live_).
                      </p>
                    </div>

                    {/* Secret Key */}
                    <div className="space-y-1.5">
                      <Label htmlFor="stripe-sk" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                        <Key className="h-3.5 w-3.5 text-slate-400" /> Stripe Secret Key (Chave Privada / Secreta)
                      </Label>
                      <Input
                        id="stripe-sk"
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="Ex: sk_test_..."
                        className="h-10 bg-white text-sm font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Utilizada exclusivamente no back-end para criar sessões de checkout de forma segura (geralmente começa com sk_test_ ou sk_live_).
                      </p>
                    </div>
                  </div>

                  {stripeActive && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-150 flex gap-2.5 items-start mt-4">
                      <AlertCircle className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Webhook de Confirmação Automatizada</h5>
                        <p className="text-[11px] leading-relaxed text-blue-700">
                          Para a baixa de estoque e o status de pagamento do pedido funcionarem de forma 100% garantida, adicione a seguinte URL de Webhook no painel do Stripe em <strong>Desenvolvedores &gt; Webhooks</strong>:
                        </p>
                        <code className="block bg-white p-2 rounded-lg border border-blue-200 text-[10px] font-mono select-all text-blue-800 break-all mt-1">
                          {window.location.origin}/api/stripe/webhook
                        </code>
                        <p className="text-[11px] text-blue-700 font-semibold mt-1">
                          Selecione o evento: <code className="bg-white px-1.5 py-0.5 rounded border text-[10px]">checkout.session.completed</code>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Save Bar */}
              <div className="flex justify-end pt-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 h-11 px-8 cursor-pointer shadow-lg shadow-blue-500/10"
                  onClick={handleSaveStripe}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar Alterações de Pagamento'}
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
