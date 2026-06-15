import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, ArrowRight, Copy, Check, QrCode } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '@/src/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [pixKey, setPixKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        console.log("[F12 DEBUG] Iniciando leitura do pedido ID:", orderId);
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (orderSnap.exists()) {
          console.log("[F12 DEBUG] Dados do pedido carregados com sucesso:", orderSnap.data());
          setOrder(orderSnap.data());
        } else {
          console.warn("[F12 DEBUG] Documento do pedido não foi localizado no Firestore para ID:", orderId);
        }

        console.log("[F12 DEBUG] Buscando configurações gerais em 'settings/general'...");
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        console.log("[F12 DEBUG] Resposta recebida para 'settings/general'. Existe?", settingsSnap.exists());
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          console.log("[F12 DEBUG] Conteúdo completo de 'settings/general':", JSON.stringify(data, null, 2));
          const key = data.pixKey || '';
          console.log("[F12 DEBUG] Chave PIX identificada no documento:", key);
          setPixKey(key);
          if (key) {
            try {
              const url = await QRCode.toDataURL(key, { margin: 1, width: 256 });
              setQrDataUrl(url);
              console.log("[F12 DEBUG] QR Code gerado locally com sucesso.");
            } catch (qrErr) {
              console.error("[F12 DEBUG] Erro ao gerar QR Code local a partir da chave PIX:", qrErr);
            }
          } else {
            console.warn("[F12 DEBUG] A chave PIX 'pixKey' está vazia ou ausente no documento.");
          }
        } else {
          console.warn("[F12 DEBUG] O documento 'settings/general' não existe no banco de dados.");
        }
      } catch (err) {
        console.error("[F12 DEBUG] Falha ao carregar dados do pedido ou configurações:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  const handleCopyKey = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast.success('Chave PIX copiada para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center max-w-2xl">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="h-20 w-20 rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white mb-6"
      >
        <CheckCircle className="h-10 w-10" />
      </motion.div>

      <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-2">Pedido Recebido!</h1>
      <p className="text-base text-muted-foreground mb-6">
        Obrigado por comprar na Dilermano. Seu pedido já foi registrado em nossa base e aguarda a transferência de pagamento.
      </p>

      {orderId && (
        <div className="w-full flex flex-col gap-1 p-4 bg-surface-elevated rounded-2xl border mb-6 text-center font-mono text-xs">
          <div>ID do Pedido: <span className="font-bold text-slate-900">{orderId}</span></div>
          {order && (
            <div className="text-sm mt-1">
              Valor Total: <span className="font-extrabold text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
            </div>
          )}
        </div>
      )}

      <div className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 mb-8 text-left space-y-5">
        <div className="flex items-center gap-2 border-b pb-3 mb-1">
          <QrCode className="h-5 w-5 text-ocean" />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Instruções para Pagamento via PIX</h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Para concluir sua compra, faça a transferência do valor total do pedido utilizando o QR Code ou copiando a chave PIX informada abaixo. Após o pagamento, o sistema processará seu pedido para envio.
        </p>

        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-2 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-sm mx-auto w-full">
            <img 
              src={qrDataUrl} 
              className="w-48 h-48 rounded-xl object-contain" 
              alt="PIX QR Code" 
            />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aponte a câmera do banco no QR Code</span>
          </div>
        ) : pixKey ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm max-w-sm mx-auto w-full text-center text-xs font-semibold text-slate-500">
            Gerando QR Code local...
          </div>
        ) : null}

        {pixKey ? (
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chave PIX Cadastrada</span>
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <span className="text-xs font-mono font-bold text-slate-800 break-all flex-1">{pixKey}</span>
              <Button 
                onClick={handleCopyKey} 
                variant="outline" 
                size="sm" 
                className="rounded-lg h-9 w-24 shrink-0 font-bold flex items-center justify-center gap-1 border-2 border-slate-200 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200">
            A chave PIX de recebimento está sendo configurada no painel administrativo. Por favor, entre em contato se necessário.
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link to="/meus-pedidos" className="flex-1 max-w-xs">
          <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 gap-2 cursor-pointer">
            Ver Meus Pedidos <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/" className="flex-1 max-w-xs">
          <Button className="w-full h-14 rounded-2xl font-bold bg-ocean gap-2 cursor-pointer">
            <ShoppingBag className="h-4 w-4" /> Continuar Comprando
          </Button>
        </Link>
      </div>

      <p className="mt-12 text-xs text-muted-foreground italic">
        Você pode acompanhar a entrega do seu pedido na seção "Ver Meus Pedidos" a qualquer momento.
      </p>
    </div>
  );
}
