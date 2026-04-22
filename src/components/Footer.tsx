import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-elevated border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tighter">DILERMANO</h3>
            <p className="text-sm text-muted-foreground">
              Estilo e qualidade para quem busca o melhor do vestuário.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/dilermano.oficial" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-ocean">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="mailto:dilermano3535@gmail.com" className="text-muted-foreground hover:text-ocean">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-ocean">Perguntas Frequentes</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-ocean">Política de Privacidade</Link></li>
              <li><Link to="/termos-de-uso" className="hover:text-ocean">Termos de Uso</Link></li>
              <li><Link to="/trocas-e-devolucoes" className="hover:text-ocean">Trocas e Devoluções</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Central de Atendimento</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> (91) 98399-7964
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> dilermano3535@gmail.com
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Rua Primeiro de Maio, 371<br />Bairro Centro - Abaetetuba/PA</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Razão Social: D S DO CARMO COMERCIO DE VESTUARIO<br />
              CNPJ: 51.178.777/0001-81
            </p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Dilermano. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
