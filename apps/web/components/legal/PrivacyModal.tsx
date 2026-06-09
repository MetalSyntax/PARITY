import React from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { Language } from '@parity/core';

interface PrivacyModalProps {
  language: Language;
  onClose: () => void;
}

const EFFECTIVE_DATE = '2026-06-07';

const content: Record<Language, { title: string; lastUpdated: string; intro: string; sections: { heading: string; body: string }[] }> = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: `Effective date: ${EFFECTIVE_DATE}`,
    intro: 'Parity Finance is built on a local-first, privacy-first principle: your financial data never leaves your device unless you explicitly choose to back it up. This policy explains exactly what data is involved and how it is handled.',
    sections: [
      {
        heading: '1. Data We Do Not Collect',
        body: 'Parity Finance does not operate any backend server, database, or user account system. We do not collect, transmit, or store your name, email address, financial transactions, account balances, or any personally identifiable information on our infrastructure. We have no access to your data.',
      },
      {
        heading: '2. Data Stored Locally on Your Device',
        body: 'All financial data you enter — transactions, accounts, budgets, goals, contacts, and settings — is stored exclusively on your device using IndexedDB (web) or SQLite (mobile). This data is encrypted at rest using AES-256-GCM with a key derived from your PIN via PBKDF2. You are the sole custodian of this data.',
      },
      {
        heading: '3. Exchange Rate API Requests',
        body: 'To display current exchange rates, the App makes outbound HTTP requests to third-party rate APIs (ve.dolarapi.com for VES rates, Binance P2P for USDT rates, and Frankfurter for EUR rates). These requests do not include any personal data — only a standard HTTPS GET request is sent. Refer to each provider\'s privacy policy for their data handling practices.',
      },
      {
        heading: '4. Optional Google Drive Backup (Dev Mode)',
        body: 'When you choose to enable Google Drive backup (available in Developer Mode), the App uses Google\'s OAuth 2.0 to request access to create and read a single file in your own Google Drive. The backup file contains your encrypted App data — it is not readable by Parity Finance or any third party without your PIN. We do not store your Google credentials. Disabling the feature or revoking App access from your Google account immediately terminates this integration.',
      },
      {
        heading: '5. Push Notifications',
        body: 'On the web version, the App uses OneSignal for optional push notifications (payment reminders, alerts). OneSignal assigns an anonymous device identifier. No personal financial data is transmitted via notifications. You can opt out of notifications at any time from the Profile settings. OneSignal\'s privacy policy governs their data handling.',
      },
      {
        heading: '6. Analytics and Tracking',
        body: 'Parity Finance does not use any analytics SDK, tracking pixel, advertising network, session recording tool, or crash reporting service that transmits personal data. No cookies are used for tracking purposes.',
      },
      {
        heading: '7. Third-Party Libraries',
        body: 'The App uses open-source libraries (React, Framer Motion, Chart.js, Tesseract.js, jsPDF, etc.) that operate entirely client-side and do not make independent network calls with personal data.',
      },
      {
        heading: '8. Data Portability and Deletion',
        body: 'You have full control over your data. You can export all your data at any time via the Export Center. To permanently delete all data, use the "Delete all data" option in Settings, which cryptographically destroys the encryption key and wipes all local stores — making your data permanently unrecoverable. Uninstalling the App also removes all locally stored data.',
      },
      {
        heading: '9. Children\'s Privacy',
        body: 'The App is not directed at children under 13. We do not knowingly collect personal information from children.',
      },
      {
        heading: '10. Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. The effective date will be updated, and the new version will be accessible within the App. Continued use of the App after changes constitutes acceptance of the updated policy.',
      },
      {
        heading: '11. Contact',
        body: 'For privacy-related inquiries, contact: https://metalsyntax.vercel.app/',
      },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: `Fecha de vigencia: ${EFFECTIVE_DATE}`,
    intro: 'Parity Finance está construido sobre un principio de privacidad desde el diseño: tus datos financieros nunca abandonan tu dispositivo a menos que elijas expresamente hacer una copia de seguridad. Esta política explica exactamente qué datos están involucrados y cómo se manejan.',
    sections: [
      {
        heading: '1. Datos que No Recopilamos',
        body: 'Parity Finance no opera ningún servidor backend, base de datos ni sistema de cuentas de usuario. No recopilamos, transmitimos ni almacenamos en nuestra infraestructura tu nombre, correo electrónico, transacciones financieras, saldos de cuentas ni ningún dato de identificación personal. No tenemos acceso a tus datos.',
      },
      {
        heading: '2. Datos Almacenados Localmente en Tu Dispositivo',
        body: 'Todos los datos financieros que introduces — transacciones, cuentas, presupuestos, metas, contactos y ajustes — se almacenan exclusivamente en tu dispositivo usando IndexedDB (web) o SQLite (móvil). Estos datos se cifran en reposo mediante AES-256-GCM con una clave derivada de tu PIN mediante PBKDF2. Tú eres el único custodio de estos datos.',
      },
      {
        heading: '3. Solicitudes a la API de Tasas de Cambio',
        body: 'Para mostrar las tasas de cambio actuales, la Aplicación realiza solicitudes HTTPS a APIs de terceros (ve.dolarapi.com para tasas VES, Binance P2P para tasas USDT y Frankfurter para tasas EUR). Estas solicitudes no incluyen ningún dato personal — solo se envía una solicitud HTTPS GET estándar. Consulta la política de privacidad de cada proveedor para sus prácticas de manejo de datos.',
      },
      {
        heading: '4. Copia de Seguridad en Google Drive (Modo Dev, Opcional)',
        body: 'Cuando eliges habilitar la copia de seguridad en Google Drive (disponible en Modo Desarrollador), la Aplicación usa OAuth 2.0 de Google para solicitar acceso a crear y leer un único archivo en tu propio Google Drive. El archivo de respaldo contiene tus datos cifrados de la Aplicación — no es legible por Parity Finance ni por terceros sin tu PIN. No almacenamos tus credenciales de Google. Deshabilitar la función o revocar el acceso desde tu cuenta de Google termina inmediatamente esta integración.',
      },
      {
        heading: '5. Notificaciones Push',
        body: 'En la versión web, la Aplicación usa OneSignal para notificaciones push opcionales (recordatorios de pagos, alertas). OneSignal asigna un identificador de dispositivo anónimo. Ningún dato financiero personal se transmite a través de las notificaciones. Puedes desactivar las notificaciones en cualquier momento desde los ajustes del Perfil. La política de privacidad de OneSignal rige el manejo de sus datos.',
      },
      {
        heading: '6. Análisis y Seguimiento',
        body: 'Parity Finance no utiliza ningún SDK de análisis, píxel de seguimiento, red publicitaria, herramienta de grabación de sesiones ni servicio de reporte de errores que transmita datos personales. No se usan cookies con fines de seguimiento.',
      },
      {
        heading: '7. Bibliotecas de Terceros',
        body: 'La Aplicación utiliza bibliotecas de código abierto (React, Framer Motion, Chart.js, Tesseract.js, jsPDF, etc.) que operan completamente del lado del cliente y no realizan llamadas de red independientes con datos personales.',
      },
      {
        heading: '8. Portabilidad y Eliminación de Datos',
        body: 'Tienes control total sobre tus datos. Puedes exportar todos tus datos en cualquier momento a través del Centro de Exportación. Para eliminar permanentemente todos los datos, usa la opción "Eliminar todos los datos" en Ajustes, que destruye criptográficamente la clave de cifrado y limpia todos los almacenes locales, haciendo tus datos permanentemente irrecuperables. Desinstalar la Aplicación también elimina todos los datos almacenados localmente.',
      },
      {
        heading: '9. Privacidad de Menores',
        body: 'La Aplicación no está dirigida a menores de 13 años. No recopilamos conscientemente información personal de menores.',
      },
      {
        heading: '10. Cambios en Esta Política',
        body: 'Podemos actualizar esta Política de Privacidad periódicamente. La fecha de vigencia se actualizará y la nueva versión estará accesible dentro de la Aplicación. El uso continuado de la Aplicación tras los cambios constituye la aceptación de la política actualizada.',
      },
      {
        heading: '11. Contacto',
        body: 'Para consultas relacionadas con la privacidad, contacta a: https://metalsyntax.vercel.app/',
      },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    lastUpdated: `Data de vigência: ${EFFECTIVE_DATE}`,
    intro: 'O Parity Finance é construído sobre um princípio de privacidade desde o design: seus dados financeiros nunca saem do seu dispositivo, a menos que você escolha explicitamente fazer um backup. Esta política explica exatamente quais dados estão envolvidos e como são tratados.',
    sections: [
      {
        heading: '1. Dados que Não Coletamos',
        body: 'O Parity Finance não opera nenhum servidor backend, banco de dados ou sistema de contas de usuário. Não coletamos, transmitimos ou armazenamos em nossa infraestrutura seu nome, endereço de e-mail, transações financeiras, saldos de contas ou qualquer informação de identificação pessoal. Não temos acesso aos seus dados.',
      },
      {
        heading: '2. Dados Armazenados Localmente no Seu Dispositivo',
        body: 'Todos os dados financeiros que você insere — transações, contas, orçamentos, metas, contatos e configurações — são armazenados exclusivamente no seu dispositivo usando IndexedDB (web) ou SQLite (mobile). Esses dados são criptografados em repouso usando AES-256-GCM com uma chave derivada do seu PIN via PBKDF2. Você é o único guardião desses dados.',
      },
      {
        heading: '3. Solicitações à API de Taxas de Câmbio',
        body: 'Para exibir as taxas de câmbio atuais, o Aplicativo faz solicitações HTTPS para APIs de terceiros (ve.dolarapi.com para taxas VES, Binance P2P para taxas USDT e Frankfurter para taxas EUR). Essas solicitações não incluem nenhum dado pessoal — apenas uma solicitação HTTPS GET padrão é enviada. Consulte a política de privacidade de cada provedor para suas práticas de tratamento de dados.',
      },
      {
        heading: '4. Backup no Google Drive (Modo Dev, Opcional)',
        body: 'Quando você opta por ativar o backup no Google Drive (disponível no Modo Desenvolvedor), o Aplicativo usa o OAuth 2.0 do Google para solicitar acesso para criar e ler um único arquivo no seu próprio Google Drive. O arquivo de backup contém seus dados criptografados do Aplicativo — não é legível pelo Parity Finance ou por terceiros sem o seu PIN. Não armazenamos suas credenciais do Google. Desativar o recurso ou revogar o acesso da sua conta do Google encerra imediatamente essa integração.',
      },
      {
        heading: '5. Notificações Push',
        body: 'Na versão web, o Aplicativo usa o OneSignal para notificações push opcionais (lembretes de pagamento, alertas). O OneSignal atribui um identificador de dispositivo anônimo. Nenhum dado financeiro pessoal é transmitido via notificações. Você pode desativar as notificações a qualquer momento nas configurações de Perfil. A política de privacidade do OneSignal rege o tratamento dos seus dados.',
      },
      {
        heading: '6. Análises e Rastreamento',
        body: 'O Parity Finance não utiliza nenhum SDK de análise, pixel de rastreamento, rede de publicidade, ferramenta de gravação de sessão ou serviço de relatório de erros que transmita dados pessoais. Nenhum cookie é usado para fins de rastreamento.',
      },
      {
        heading: '7. Bibliotecas de Terceiros',
        body: 'O Aplicativo usa bibliotecas de código aberto (React, Framer Motion, Chart.js, Tesseract.js, jsPDF, etc.) que operam inteiramente do lado do cliente e não fazem chamadas de rede independentes com dados pessoais.',
      },
      {
        heading: '8. Portabilidade e Exclusão de Dados',
        body: 'Você tem controle total sobre seus dados. Pode exportar todos os seus dados a qualquer momento pelo Centro de Exportação. Para excluir permanentemente todos os dados, use a opção "Excluir todos os dados" em Configurações, que destrói criptograficamente a chave de criptografia e apaga todos os armazenamentos locais — tornando seus dados permanentemente irrecuperáveis. Desinstalar o Aplicativo também remove todos os dados armazenados localmente.',
      },
      {
        heading: '9. Privacidade de Crianças',
        body: 'O Aplicativo não é direcionado a crianças menores de 13 anos. Não coletamos conscientemente informações pessoais de crianças.',
      },
      {
        heading: '10. Alterações nesta Política',
        body: 'Podemos atualizar esta Política de Privacidade periodicamente. A data de vigência será atualizada e a nova versão estará acessível no Aplicativo. O uso continuado do Aplicativo após as alterações constitui aceitação da política atualizada.',
      },
      {
        heading: '11. Contato',
        body: 'Para consultas relacionadas à privacidade, entre em contato: https://metalsyntax.vercel.app/',
      },
    ],
  },
};

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ language, onClose }) => {
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
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

        {/* Intro highlight */}
        <div className="mx-6 mt-5 mb-1 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
          <p className="text-sm text-emerald-400 leading-relaxed font-medium">{doc.intro}</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 no-scrollbar">
          {doc.sections.map((s) => (
            <div key={s.heading}>
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">{s.heading}</h3>
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
