import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { Language } from '@parity/core';

interface TermsModalProps {
  language: Language;
  onClose: () => void;
}

const EFFECTIVE_DATE = '2026-06-07';

const content: Record<Language, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  en: {
    title: 'Terms & Conditions',
    lastUpdated: `Effective date: ${EFFECTIVE_DATE}`,
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By downloading, installing, or using Parity Finance ("the App"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not use the App.',
      },
      {
        heading: '2. Description of the App',
        body: 'Parity Finance is a personal financial tracking application designed for use in multi-currency environments. The App allows users to record, organize, and visualize their personal financial data entirely on their own device. The App does not provide financial, investment, tax, or legal advice of any kind.',
      },
      {
        heading: '3. No Financial Advice',
        body: 'IMPORTANT: Nothing in the App, including exchange rate displays, budget projections, spending analyses, AI-generated commentary, or any other feature, constitutes financial, investment, economic, legal, or tax advice. All information is provided strictly for personal organizational and informational purposes. You are solely responsible for all financial decisions you make. Always consult a qualified professional before making financial decisions.',
      },
      {
        heading: '4. Exchange Rate Information',
        body: 'Exchange rates displayed in the App are obtained from third-party APIs (including but not limited to ve.dolarapi.com, Binance P2P, and Frankfurter). These rates are informational only and may not reflect real-time, official, or legally binding rates. Parity Finance does not guarantee the accuracy, completeness, or timeliness of any exchange rate data. The App shall not be liable for any losses or damages resulting from reliance on such rates.',
      },
      {
        heading: '5. Data Storage and Responsibility',
        body: 'All your financial data is stored locally on your device in encrypted form using AES-256-GCM encryption. Parity Finance does not transmit, store, or have access to your personal financial data on any server. You are solely responsible for maintaining backups of your data. The developer shall not be liable for any data loss, including loss resulting from device failure, App uninstallation, operating system updates, or any other cause.',
      },
      {
        heading: '6. Optional Cloud Backup',
        body: 'The App offers an optional Google Drive backup feature accessible in Developer Mode. When enabled, your encrypted data is stored in your own personal Google Drive account. Parity Finance does not have access to your Google Drive credentials or the stored data beyond what is necessary to write and read the encrypted backup file. Use of this feature is subject to Google\'s Terms of Service.',
      },
      {
        heading: '7. No Warranty',
        body: 'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. THE DEVELOPER DOES NOT WARRANT THAT THE APP WILL BE ERROR-FREE, UNINTERRUPTED, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.',
      },
      {
        heading: '8. Limitation of Liability',
        body: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PARITY FINANCE OR ITS DEVELOPER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF OR INABILITY TO USE THE APP, REGARDLESS OF THE THEORY OF LIABILITY.',
      },
      {
        heading: '9. Third-Party Services',
        body: 'The App may interact with third-party services (exchange rate APIs, Google Drive, push notification providers). Use of these services is governed by their respective terms. Parity Finance is not responsible for the availability, accuracy, or practices of third-party services.',
      },
      {
        heading: '10. Modifications',
        body: 'The developer reserves the right to modify these Terms at any time. Continued use of the App after changes are posted constitutes acceptance of the revised Terms. The effective date at the top of this document will be updated accordingly.',
      },
      {
        heading: '11. Governing Law',
        body: 'These Terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved in the competent courts of the jurisdiction where the developer is domiciled.',
      },
      {
        heading: '12. Contact',
        body: 'For questions about these Terms, contact: sar@multiproconsulting.com',
      },
    ],
  },
  es: {
    title: 'Términos y Condiciones',
    lastUpdated: `Fecha de vigencia: ${EFFECTIVE_DATE}`,
    sections: [
      {
        heading: '1. Aceptación de los Términos',
        body: 'Al descargar, instalar o utilizar Parity Finance ("la Aplicación"), aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con estos términos, no utilices la Aplicación.',
      },
      {
        heading: '2. Descripción de la Aplicación',
        body: 'Parity Finance es una aplicación de seguimiento financiero personal diseñada para entornos multimoneda. La Aplicación permite a los usuarios registrar, organizar y visualizar sus datos financieros personales completamente en su propio dispositivo. La Aplicación no proporciona asesoría financiera, de inversión, tributaria ni legal de ningún tipo.',
      },
      {
        heading: '3. Sin Asesoría Financiera',
        body: 'IMPORTANTE: Nada en la Aplicación, incluyendo la visualización de tasas de cambio, proyecciones presupuestarias, análisis de gastos, comentarios generados por inteligencia artificial, ni ninguna otra función, constituye asesoría financiera, de inversión, económica, legal o tributaria. Toda la información se proporciona estrictamente con fines organizativos e informativos personales. Eres el único responsable de todas las decisiones financieras que tomes. Siempre consulta a un profesional calificado antes de tomar decisiones financieras.',
      },
      {
        heading: '4. Información de Tasas de Cambio',
        body: 'Las tasas de cambio mostradas en la Aplicación se obtienen de APIs de terceros (incluyendo, entre otras, ve.dolarapi.com, Binance P2P y Frankfurter). Estas tasas son únicamente de carácter informativo y pueden no reflejar tasas en tiempo real, oficiales o jurídicamente vinculantes. Parity Finance no garantiza la exactitud, integridad ni actualidad de ningún dato de tasa de cambio. La Aplicación no será responsable de pérdidas o daños resultantes del uso de dichas tasas como referencia para operaciones financieras.',
      },
      {
        heading: '5. Almacenamiento de Datos y Responsabilidad',
        body: 'Todos tus datos financieros se almacenan localmente en tu dispositivo en formato cifrado mediante encriptación AES-256-GCM. Parity Finance no transmite, almacena ni tiene acceso a tus datos financieros personales en ningún servidor. Eres el único responsable de mantener copias de seguridad de tus datos. El desarrollador no será responsable de ninguna pérdida de datos, incluyendo la pérdida derivada de fallas del dispositivo, desinstalación de la Aplicación, actualizaciones del sistema operativo u otras causas.',
      },
      {
        heading: '6. Copia de Seguridad en la Nube (Opcional)',
        body: 'La Aplicación ofrece una función opcional de copia de seguridad en Google Drive, accesible en el Modo Desarrollador. Cuando está habilitada, tus datos cifrados se almacenan en tu propia cuenta personal de Google Drive. Parity Finance no tiene acceso a tus credenciales de Google Drive ni a los datos almacenados, más allá de lo necesario para escribir y leer el archivo de respaldo cifrado. El uso de esta función está sujeto a los Términos de Servicio de Google.',
      },
      {
        heading: '7. Sin Garantía',
        body: 'LA APLICACIÓN SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍAS DE NINGÚN TIPO, EXPRESAS O IMPLÍCITAS, INCLUYENDO PERO SIN LIMITARSE A GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR Y NO INFRACCIÓN. EL DESARROLLADOR NO GARANTIZA QUE LA APLICACIÓN ESTÉ LIBRE DE ERRORES, SEA ININTERRUMPIDA, SEGURA O LIBRE DE VIRUS U OTROS COMPONENTES DAÑINOS.',
      },
      {
        heading: '8. Limitación de Responsabilidad',
        body: 'EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, EN NINGÚN CASO PARITY FINANCE NI SU DESARROLLADOR SERÁN RESPONSABLES DE DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, INCLUYENDO SIN LIMITACIÓN LA PÉRDIDA DE GANANCIAS, DATOS, USO, BUENA VOLUNTAD U OTRAS PÉRDIDAS INTANGIBLES, RESULTANTES DEL USO O IMPOSIBILIDAD DE USO DE LA APLICACIÓN.',
      },
      {
        heading: '9. Servicios de Terceros',
        body: 'La Aplicación puede interactuar con servicios de terceros (APIs de tasas de cambio, Google Drive, proveedores de notificaciones push). El uso de estos servicios se rige por sus respectivos términos. Parity Finance no es responsable de la disponibilidad, exactitud ni las prácticas de los servicios de terceros.',
      },
      {
        heading: '10. Modificaciones',
        body: 'El desarrollador se reserva el derecho de modificar estos Términos en cualquier momento. El uso continuado de la Aplicación después de la publicación de los cambios constituye la aceptación de los Términos revisados. La fecha de vigencia al inicio de este documento se actualizará en consecuencia.',
      },
      {
        heading: '11. Ley Aplicable',
        body: 'Estos Términos se regirán e interpretarán de acuerdo con la legislación aplicable. Cualquier controversia se resolverá ante los tribunales competentes de la jurisdicción donde el desarrollador tenga su domicilio.',
      },
      {
        heading: '12. Contacto',
        body: 'Para consultas sobre estos Términos, contacta a: sar@multiproconsulting.com',
      },
    ],
  },
  pt: {
    title: 'Termos e Condições',
    lastUpdated: `Data de vigência: ${EFFECTIVE_DATE}`,
    sections: [
      {
        heading: '1. Aceitação dos Termos',
        body: 'Ao baixar, instalar ou usar o Parity Finance ("o Aplicativo"), você concorda em ficar vinculado a estes Termos e Condições. Se não concordar com estes termos, não use o Aplicativo.',
      },
      {
        heading: '2. Descrição do Aplicativo',
        body: 'O Parity Finance é um aplicativo de rastreamento financeiro pessoal projetado para ambientes multimoeda. O Aplicativo permite que os usuários registrem, organizem e visualizem seus dados financeiros pessoais inteiramente em seu próprio dispositivo. O Aplicativo não fornece aconselhamento financeiro, de investimento, tributário ou jurídico de qualquer natureza.',
      },
      {
        heading: '3. Sem Aconselhamento Financeiro',
        body: 'IMPORTANTE: Nada no Aplicativo, incluindo exibições de taxas de câmbio, projeções orçamentárias, análises de gastos, comentários gerados por inteligência artificial ou qualquer outro recurso, constitui aconselhamento financeiro, de investimento, econômico, jurídico ou tributário. Todas as informações são fornecidas estritamente para fins organizacionais e informativos pessoais. Você é o único responsável por todas as decisões financeiras que tomar. Sempre consulte um profissional qualificado antes de tomar decisões financeiras.',
      },
      {
        heading: '4. Informações sobre Taxas de Câmbio',
        body: 'As taxas de câmbio exibidas no Aplicativo são obtidas de APIs de terceiros (incluindo, mas não se limitando a ve.dolarapi.com, Binance P2P e Frankfurter). Essas taxas são meramente informativas e podem não refletir taxas em tempo real, oficiais ou juridicamente vinculantes. O Parity Finance não garante a precisão, integridade ou atualidade de qualquer dado de taxa de câmbio. O Aplicativo não será responsável por perdas ou danos resultantes do uso de tais taxas.',
      },
      {
        heading: '5. Armazenamento de Dados e Responsabilidade',
        body: 'Todos os seus dados financeiros são armazenados localmente no seu dispositivo em formato criptografado usando criptografia AES-256-GCM. O Parity Finance não transmite, armazena nem tem acesso aos seus dados financeiros pessoais em nenhum servidor. Você é o único responsável por manter backups dos seus dados. O desenvolvedor não será responsável por nenhuma perda de dados, incluindo perdas resultantes de falha do dispositivo, desinstalação do Aplicativo, atualizações do sistema operacional ou qualquer outra causa.',
      },
      {
        heading: '6. Backup em Nuvem (Opcional)',
        body: 'O Aplicativo oferece um recurso opcional de backup no Google Drive, acessível no Modo Desenvolvedor. Quando ativado, seus dados criptografados são armazenados na sua própria conta pessoal do Google Drive. O Parity Finance não tem acesso às suas credenciais do Google Drive nem aos dados armazenados, além do necessário para gravar e ler o arquivo de backup criptografado. O uso deste recurso está sujeito aos Termos de Serviço do Google.',
      },
      {
        heading: '7. Sem Garantia',
        body: 'O APLICATIVO É FORNECIDO "NO ESTADO EM QUE SE ENCONTRA" E "CONFORME DISPONÍVEL", SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS, INCLUINDO MAS NÃO SE LIMITANDO A GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM PROPÓSITO ESPECÍFICO E NÃO VIOLAÇÃO. O DESENVOLVEDOR NÃO GARANTE QUE O APLICATIVO ESTARÁ LIVRE DE ERROS, SERÁ ININTERRUPTO, SEGURO OU LIVRE DE VÍRUS OU OUTROS COMPONENTES PREJUDICIAIS.',
      },
      {
        heading: '8. Limitação de Responsabilidade',
        body: 'NA MÁXIMA EXTENSÃO PERMITIDA PELA LEI APLICÁVEL, EM HIPÓTESE ALGUMA O PARITY FINANCE OU SEU DESENVOLVEDOR SERÃO RESPONSÁVEIS POR QUAISQUER DANOS INDIRETOS, INCIDENTAIS, ESPECIAIS, CONSEQUENCIAIS OU PUNITIVOS, INCLUINDO SEM LIMITAÇÃO PERDA DE LUCROS, DADOS, USO, FUNDO DE COMÉRCIO OU OUTRAS PERDAS INTANGÍVEIS, RESULTANTES DO USO OU INCAPACIDADE DE USO DO APLICATIVO.',
      },
      {
        heading: '9. Serviços de Terceiros',
        body: 'O Aplicativo pode interagir com serviços de terceiros (APIs de taxas de câmbio, Google Drive, provedores de notificações push). O uso desses serviços é regido pelos seus respectivos termos. O Parity Finance não é responsável pela disponibilidade, precisão ou práticas de serviços de terceiros.',
      },
      {
        heading: '10. Modificações',
        body: 'O desenvolvedor reserva-se o direito de modificar estes Termos a qualquer momento. O uso continuado do Aplicativo após a publicação das alterações constitui aceitação dos Termos revisados. A data de vigência no topo deste documento será atualizada de acordo.',
      },
      {
        heading: '11. Lei Aplicável',
        body: 'Estes Termos serão regidos e interpretados de acordo com a lei aplicável. Quaisquer disputas serão resolvidas nos tribunais competentes da jurisdição onde o desenvolvedor está domiciliado.',
      },
      {
        heading: '12. Contato',
        body: 'Para dúvidas sobre estes Termos, entre em contato: sar@multiproconsulting.com',
      },
    ],
  },
};

export const TermsModal: React.FC<TermsModalProps> = ({ language, onClose }) => {
  const doc = content[language] ?? content.es;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full sm:max-w-lg bg-theme-surface border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-brand/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-theme-brand" />
            </div>
            <div>
              <h2 className="text-base font-black text-theme-primary leading-tight">{doc.title}</h2>
              <p className="text-[10px] text-theme-secondary opacity-50 mt-0.5">{doc.lastUpdated}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-theme-secondary" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 no-scrollbar">
          {doc.sections.map((s) => (
            <div key={s.heading}>
              <h3 className="text-xs font-black text-theme-brand uppercase tracking-widest mb-2">{s.heading}</h3>
              <p className="text-sm text-theme-secondary leading-relaxed opacity-80">{s.body}</p>
            </div>
          ))}
          <div className="pb-safe" />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-white/8 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-theme-secondary font-bold text-sm transition-colors"
          >
            {language === 'es' ? 'Cerrar' : language === 'pt' ? 'Fechar' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
