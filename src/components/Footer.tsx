import { useState, useEffect } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterLink {
  text: string;
  url: string;
}

export default function Footer() {
  const [data, setData] = useState({
    storeName: 'DILERMANO',
    institutionalText: 'Estilo e qualidade para quem busca o melhor do vestuário.',
    instagramUrl: 'https://instagram.com/dilermano.oficial',
    email: 'dilermano3535@gmail.com',
    phone: '(91) 98399-7964',
    address: 'Rua Primeiro de Maio, 371\nBairro Centro - Abaetetuba/PA',
    razaoSocial: 'D S DO CARMO COMERCIO DE VESTUARIO',
    cnpj: '51.178.777/0001-81',
    linksTitle: 'Links Úteis',
    contactTitle: 'Central de Atendimento',
    companyTitle: 'Empresa',
    links: [
      { text: 'Perguntas Frequentes', url: '/faq' },
      { text: 'Política de Privacidade', url: '/politica-de-privacidade' },
      { text: 'Termos de Uso', url: '/termos-de-uso' },
      { text: 'Trocas e Devoluções', url: '/trocas-e-devolucoes' }
    ] as FooterLink[]
  });

  useEffect(() => {
    // Realtime listen for footer settings doc
    const unsub = onSnapshot(
      doc(db, 'settings', 'footer'),
      (snapshot) => {
        if (snapshot.exists()) {
          const fsData = snapshot.data();
          setData({
            storeName: fsData.storeName || 'DILERMANO',
            institutionalText: fsData.institutionalText || 'Estilo e qualidade para quem busca o melhor do vestuário.',
            instagramUrl: fsData.instagramUrl || 'https://instagram.com/dilermano.oficial',
            email: fsData.email || 'dilermano3535@gmail.com',
            phone: fsData.phone || '(91) 98399-7964',
            address: fsData.address || 'Rua Primeiro de Maio, 371\nBairro Centro - Abaetetuba/PA',
            razaoSocial: fsData.razaoSocial || 'D S DO CARMO COMERCIO DE VESTUARIO',
            cnpj: fsData.cnpj || '51.178.777/0001-81',
            linksTitle: fsData.linksTitle || 'Links Úteis',
            contactTitle: fsData.contactTitle || 'Central de Atendimento',
            companyTitle: fsData.companyTitle || 'Empresa',
            links: Array.isArray(fsData.links) && fsData.links.length > 0
              ? fsData.links
              : [
                  { text: 'Perguntas Frequentes', url: '/faq' },
                  { text: 'Política de Privacidade', url: '/politica-de-privacidade' },
                  { text: 'Termos de Uso', url: '/termos-de-uso' },
                  { text: 'Trocas e Devoluções', url: '/trocas-e-devolucoes' }
                ]
          });
        }
      },
      (error) => {
        console.error('Erro ao ler configurações do Rodapé no Firestore:', error);
      }
    );

    return () => unsub();
  }, []);

  return (
    <footer className="bg-surface-elevated border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tighter uppercase">{data.storeName}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {data.institutionalText}
            </p>
            <div className="flex items-center gap-4">
              {data.instagramUrl && (
                <a
                  href={data.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-ocean transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {data.email && (
                <a
                  href={`mailto:${data.email}`}
                  className="text-muted-foreground hover:text-ocean transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-slate-800">{data.linksTitle}</h4>
            <ul className="space-y-2 text-sm">
              {data.links.map((linkItem, idx) => {
                if (!linkItem.text) return null;
                const isExternal = linkItem.url.startsWith('http') || linkItem.url.startsWith('https');
                
                return (
                  <li key={idx}>
                    {isExternal ? (
                      <a
                        href={linkItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-ocean transition-colors"
                      >
                        {linkItem.text}
                      </a>
                    ) : (
                      <Link
                        to={linkItem.url}
                        className="text-muted-foreground hover:text-ocean transition-colors"
                      >
                        {linkItem.text}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-slate-800">{data.contactTitle}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {data.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" /> {data.phone}
                </li>
              )}
              {data.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" /> {data.email}
                </li>
              )}
              {data.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                  <span className="whitespace-pre-line leading-relaxed">{data.address}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-slate-800">{data.companyTitle}</h4>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
              {data.razaoSocial && (
                <div>
                  <span className="font-medium text-slate-600">Razão Social:</span> {data.razaoSocial}
                </div>
              )}
              {data.cnpj && (
                <div>
                  <span className="font-medium text-slate-600">CNPJ:</span> {data.cnpj}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {data.storeName.charAt(0) + data.storeName.slice(1).toLowerCase()}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
