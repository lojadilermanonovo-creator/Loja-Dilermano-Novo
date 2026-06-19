import { useLocation, Link } from 'react-router-dom';
import { HelpCircle, ShieldCheck, FileText, RotateCcw, ArrowLeft, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InstitutionalPageProps {
  type: 'faq' | 'privacy' | 'terms' | 'refunds';
}

export default function InstitutionalPage({ type }: InstitutionalPageProps) {
  const location = useLocation();

  const menuItems = [
    {
      id: 'faq',
      label: 'Perguntas Frequentes',
      path: '/faq',
      icon: HelpCircle,
      description: 'Dúvidas comuns sobre compras e produtos'
    },
    {
      id: 'privacy',
      label: 'Política de Privacidade',
      path: '/politica-de-privacidade',
      icon: ShieldCheck,
      description: 'Como protegemos seus dados pessoais'
    },
    {
      id: 'terms',
      label: 'Termos de Uso',
      path: '/termos-de-uso',
      icon: FileText,
      description: 'Regras de utilização da plataforma'
    },
    {
      id: 'refunds',
      label: 'Trocas e Devoluções',
      path: '/trocas-e-devolucoes',
      icon: RotateCcw,
      description: 'Prazos e condições para trocas'
    }
  ];

  return (
    <div className="bg-slate-50/50 min-h-screen py-10 sm:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Navigation Breadcrumb/Back */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para a Loja
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">
            {type === 'faq' && 'Perguntas Frequentes'}
            {type === 'privacy' && 'Política de Privacidade'}
            {type === 'terms' && 'Termos de Uso'}
            {type === 'refunds' && 'Trocas e Devoluções'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl font-medium">
            {type === 'faq' && 'Encontre respostas rápidas para as dúvidas mais comuns de nossos clientes.'}
            {type === 'privacy' && 'Entenda como tratamos e protegemos suas informações de forma transparente.'}
            {type === 'terms' && 'Termos, diretrizes e regras gerais para uso de nossos serviços e site.'}
            {type === 'refunds' && 'Nossa política de trocas e devoluções para garantir sua plena satisfação de compra.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Menu */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3">Links Úteis</h3>
            <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === type;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                      isActive
                        ? "bg-slate-900 text-white font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <div className="text-left">
                      <span className="text-xs sm:text-xs block font-bold leading-tight">{item.label}</span>
                      <span className={cn(
                        "text-[10px] block font-medium mt-0.5 leading-none transition-colors",
                        isActive ? "text-slate-300" : "text-slate-400 group-hover:text-slate-550"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Support Widget */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 leading-none">
                <MessageSquare className="h-4 w-4 text-emerald-400" /> Atendimento
              </h4>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Ainda tem dúvidas? Fale diretamente com nossa equipe de suporte pelo WhatsApp.
              </p>
              <a
                href="https://wa.me/5591983997964"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-2 transition-transform duration-200 text-xs uppercase"
              >
                Falar Conosco
              </a>
            </div>
          </div>

          {/* Page Content Area Container */}
          <div className="lg:col-span-8">
            <Card className="rounded-2xl border border-slate-150 shadow-sm bg-white p-6 sm:p-10">
              {type === 'faq' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-slate-400" /> Respostas Rápidas
                    </h2>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-930 mb-2.5">
                        1. Como faço minha compra?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                        Escolha seus produtos, adicione ao carrinho e finalize seu pedido com segurança. Após a confirmação do pagamento, você receberá as informações do pedido.
                      </p>
                    </div>

                    <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-930 mb-2.5">
                        2. Quais formas de pagamento são aceitas?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                        Aceitamos as principais formas de pagamento disponíveis no checkout, incluindo cartão de crédito e outras opções oferecidas pela loja.
                      </p>
                    </div>

                    <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-930 mb-2.5">
                        3. Como acompanho meu pedido?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                        Após o envio, você receberá as informações de rastreamento para acompanhar a entrega.
                      </p>
                    </div>

                    <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-930 mb-2.5">
                        4. Os produtos possuem garantia?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                        Sim. Trabalhamos para garantir a qualidade dos produtos e oferecer suporte caso ocorra algum problema.
                      </p>
                    </div>

                    <div className="bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-100">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-930 mb-2.5">
                        5. Posso alterar ou cancelar meu pedido?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                        Alterações ou cancelamentos devem ser solicitados o quanto antes pelo nosso atendimento, pois pedidos em processo de envio podem não conseguir ser modificados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {type === 'privacy' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-slate-400" /> Diretrizes de Privacidade
                    </h2>
                  </div>

                  <div className="space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                    <p>
                      A sua privacidade é importante para nós. Todas as informações fornecidas durante sua navegação e compra são utilizadas exclusivamente para processar pedidos, melhorar sua experiência e oferecer um atendimento de qualidade.
                    </p>
                    <p>
                      Seus dados pessoais são protegidos e não são vendidos, compartilhados ou utilizados para finalidades diferentes das informadas nesta política.
                    </p>
                    <p>
                      Utilizamos tecnologias de segurança para proteger suas informações durante todo o processo de compra.
                    </p>
                  </div>
                </div>
              )}

              {type === 'terms' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-400" /> Termos de Serviço
                    </h2>
                  </div>

                  <div className="space-y-5 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                    <p>
                      Ao acessar e utilizar nossa loja, você concorda com os termos e condições apresentados.
                    </p>
                    <p>
                      As informações dos produtos, preços, condições de pagamento e disponibilidade podem ser atualizadas a qualquer momento para garantir uma experiência segura e transparente.
                    </p>
                    <p>
                      Nos comprometemos a oferecer produtos de qualidade, atendimento eficiente e uma experiência de compra confiável aos nossos clientes.
                    </p>
                  </div>
                </div>
              )}

              {type === 'refunds' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <RotateCcw className="h-5 w-5 text-slate-400" /> Política de Devoluções
                    </h2>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                    <p>
                      Nossa prioridade é garantir sua satisfação.
                    </p>
                    <p>
                      Caso precise solicitar uma troca ou devolução, entre em contato com nosso atendimento dentro do prazo estabelecido, informando o número do pedido e o motivo da solicitação.
                    </p>
                    <p>
                      Os produtos devem ser devolvidos conforme as condições informadas pela loja, preferencialmente sem sinais de uso e com todos os itens originais.
                    </p>
                    <p>
                      Após a análise do produto, seguiremos com a solução adequada conforme nossa política.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
