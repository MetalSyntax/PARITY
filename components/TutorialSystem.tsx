import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, GraduationCap, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TutorialStep {
  title: string;
  description: string;
  selector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface Tutorial {
  id: string;
  title: string;
  emoji: string;
  description: string;
  steps: TutorialStep[];
}

interface TutorialSystemProps {
  onClose: () => void;
}

// ─── Tutorial Data ─────────────────────────────────────────────────────────────

const TUTORIALS: Tutorial[] = [
  {
    id: "record-income",
    title: "Registrar un ingreso",
    emoji: "💰",
    description: "Aprende a agregar tus fuentes de ingresos",
    steps: [
      {
        title: "Botón principal (+)",
        description: 'El gran botón "+" en la barra inferior es tu acceso principal para crear cualquier transacción nueva.',
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: 'Selecciona "Ingreso"',
        description: "Al abrir el formulario verás tres tipos en la parte superior: Gasto, Ingreso y Transferencia. Toca Ingreso.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Ingresa el monto",
        description: "Usa el teclado numérico para escribir el monto. Toca el selector de moneda para cambiar entre USD, Bs y EUR.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Elige la categoría",
        description: "Selecciona una categoría como Salario, Freelance, Inversiones, etc. para clasificar tu ingreso correctamente.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Guarda el ingreso",
        description: "Agrega una nota opcional y toca el botón de confirmar. ¡Tu ingreso quedará registrado y el balance se actualizará!",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
    ],
  },
  {
    id: "record-expense",
    title: "Registrar un gasto",
    emoji: "🧾",
    description: "Registra tus gastos diarios fácilmente",
    steps: [
      {
        title: "Abrir formulario",
        description: 'Toca el "+" en la barra inferior. También puedes usar los accesos rápidos del Dashboard.',
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Tipo Gasto (por defecto)",
        description: '"Gasto" es el tipo seleccionado automáticamente al abrir el formulario — no necesitas cambiarlo.',
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Detección inteligente",
        description: "Al escribir el nombre del comercio en el campo de nota (ej. 'McDonald's'), la app detecta la categoría automáticamente.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Selecciona la cuenta",
        description: "Elige de qué cuenta se descuenta el gasto. El monto se registrará en la moneda de esa cuenta.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Confirma el gasto",
        description: "Verifica el monto y toca confirmar. El balance de tu cuenta se descontará de inmediato.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
    ],
  },
  {
    id: "create-transfer",
    title: "Transferencia entre cuentas",
    emoji: "🔄",
    description: "Mueve dinero entre tus wallets",
    steps: [
      {
        title: "Acceso rápido",
        description: "Desliza los accesos rápidos del Dashboard y toca Transferencia, o usa el botón \"+\" y selecciona el tipo.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Origen y destino",
        description: "Selecciona la cuenta de origen (de dónde sale) y la cuenta de destino (a dónde llega). Puedes tocar cada una para cambiarla.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Tipo de cambio automático",
        description: "Si las cuentas son de distinta moneda (ej. Bs → USD), la app calcula la tasa automáticamente. Puedes ajustarla manualmente.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Comisiones bancarias",
        description: "Si hay comisión, ingrésala como monto fijo o porcentaje en la sección \"Comisiones\". Sale de la cuenta origen.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Confirmar transferencia",
        description: "Revisa el monto enviado y el que llega al destino. Toca confirmar para completar la transferencia.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
    ],
  },
  {
    id: "add-account",
    title: "Agregar cuenta bancaria",
    emoji: "🏦",
    description: "Crea y gestiona tus cuentas y wallets",
    steps: [
      {
        title: "Ir a Wallets",
        description: "Toca el acceso rápido \"Wallet\" en el Dashboard para abrir la vista de gestión de cuentas.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Resumen en Dashboard",
        description: "El widget de Wallets muestra todas tus cuentas con su balance actual en la moneda correspondiente.",
        selector: "[data-label='wallets']",
        position: "top",
      },
      {
        title: "Crear cuenta nueva",
        description: "En la vista Wallet toca \"+\". Asígnale un nombre descriptivo (ej. \"Banco Venezuela\") y elige la moneda (USD, Bs, EUR, USDT).",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Saldo inicial",
        description: "Ingresa el saldo actual de tu cuenta para que el balance refleje la realidad desde el primer momento.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Ícono y color",
        description: "Personaliza el ícono y color de la cuenta para identificarla fácilmente en el Dashboard.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
    ],
  },
  {
    id: "categorize-transaction",
    title: "Categorizar transacciones",
    emoji: "🏷️",
    description: "Organiza tus movimientos por categorías",
    steps: [
      {
        title: "Detección automática",
        description: "Al escribir el nombre de un comercio conocido en la nota, la app asigna la categoría sin que hagas nada.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "+30 categorías disponibles",
        description: "Puedes seleccionar manualmente entre categorías como Alimentación, Transporte, Salud, Entretenimiento, y más.",
        selector: "[data-tutorial='fab-add']",
        position: "top",
      },
      {
        title: "Gráfico de gastos",
        description: "El widget de Estructura de Gastos muestra cómo se distribuyen tus gastos por categoría con gráfico interactivo.",
        selector: "[data-label='expenses']",
        position: "top",
      },
      {
        title: "Filtrar por categoría",
        description: "En la vista de Transacciones puedes filtrar por categoría específica para ver todos los movimientos de ese tipo.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Editar categoría",
        description: "Si necesitas cambiar la categoría de un movimiento existente, tócalo en el historial y selecciona Editar.",
        selector: "[data-label='transactions']",
        position: "top",
      },
    ],
  },
  {
    id: "set-budget",
    title: "Establecer un presupuesto",
    emoji: "📊",
    description: "Controla tus gastos con límites mensuales",
    steps: [
      {
        title: "Acceder a Presupuestos",
        description: "Toca el acceso rápido \"Presupuesto\" para abrir la vista de gestión de límites de gasto.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Crear presupuesto",
        description: "Toca \"+\" para crear un nuevo presupuesto. Selecciona la categoría a la que quieres asignar un límite.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Define el límite",
        description: "Ingresa el monto máximo mensual para esa categoría. Puedes definirlo en USD o Bs según prefieras.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Seguimiento automático",
        description: "La app suma automáticamente los gastos de esa categoría y te avisa cuando te acerques al límite.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Resumen en Dashboard",
        description: "El widget de Resumen Fiscal muestra tu situación fiscal del año. El widget de Pronóstico estima tu gasto a fin de mes.",
        selector: "[data-label='forecastCard']",
        position: "top",
      },
    ],
  },
  {
    id: "expense-report",
    title: "Reporte de gastos",
    emoji: "📈",
    description: "Analiza tus gastos por categoría y período",
    steps: [
      {
        title: "Estructura de Gastos",
        description: "Este widget muestra un gráfico de tus categorías de gasto. Toca cualquier segmento para ver el detalle.",
        selector: "[data-label='expenses']",
        position: "top",
      },
      {
        title: "Vista de Análisis",
        description: "Toca \"Análisis\" en los accesos rápidos para reportes detallados con filtros por fecha y categoría.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Ingresos vs Gastos",
        description: "El widget de Ingresos vs Gastos compara tus flujos mensuales en un gráfico de barras por mes.",
        selector: "[data-label='incomeVsExpense']",
        position: "top",
      },
      {
        title: "Resumen Fiscal",
        description: "El Resumen Fiscal muestra ingresos gravables y gastos deducibles del año fiscal actual.",
        selector: "[data-label='fiscalSummary']",
        position: "top",
      },
      {
        title: "Exportar PDF",
        description: "El acceso rápido \"PDF Report\" genera un reporte visual completo con gráficos y estadísticas del período elegido.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
    ],
  },
  {
    id: "recurring-transaction",
    title: "Transacciones recurrentes",
    emoji: "🔁",
    description: "Automatiza pagos y cobros fijos",
    steps: [
      {
        title: "Accede a Programados",
        description: "Toca el acceso rápido \"Programados\" para ver y crear pagos o cobros recurrentes.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Crear programación",
        description: "Toca \"+\" y define el monto, categoría y frecuencia: diario, semanal, mensual o anual.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Fecha de inicio",
        description: "Establece la fecha del primer pago o cobro. La app creará la transacción automáticamente en esa fecha.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Activar y pausar",
        description: "Puedes activar, pausar o eliminar una programación en cualquier momento desde la lista de Programados.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Calendario Financiero",
        description: "El acceso rápido \"Calendario Financiero\" muestra todas tus transacciones programadas en vista de calendario.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
    ],
  },
  {
    id: "export-summary",
    title: "Exportar resumen financiero",
    emoji: "📤",
    description: "Comparte o respalda tus datos",
    steps: [
      {
        title: "Centro de Exportación",
        description: "Toca el acceso rápido \"Exportar\" para acceder a todas las opciones de exportación disponibles.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Formatos disponibles",
        description: "Puedes exportar en CSV (para Excel/Google Sheets) o JSON (respaldo completo de todos tus datos).",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Reporte PDF",
        description: "El acceso rápido \"PDF Report\" genera un reporte visual con gráficos y estadísticas del período seleccionado.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Respaldo en la nube",
        description: "Toca el ícono de nube (☁) en la esquina superior para respaldar todos tus datos en Google Drive.",
        selector: "[data-tutorial='sync-btn']",
        position: "bottom",
      },
      {
        title: "Importar datos",
        description: "El acceso rápido \"Importar\" permite restaurar datos desde un respaldo CSV o JSON previo.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
    ],
  },
  {
    id: "customize-dashboard",
    title: "Personalizar el Dashboard",
    emoji: "🎨",
    description: "Organiza los widgets a tu gusto",
    steps: [
      {
        title: "Botón de personalización",
        description: "Toca este ícono de engranaje (⚙) para abrir el personalizador del Dashboard.",
        selector: "[data-tutorial='customize-btn']",
        position: "bottom",
      },
      {
        title: "Mostrar u ocultar widgets",
        description: "Activa o desactiva widgets individualmente: Balance Chart, Estructura de Gastos, Pronóstico, Resumen Fiscal, Metas, etc.",
        selector: "[data-tutorial='customize-btn']",
        position: "bottom",
      },
      {
        title: "Reordenar widgets",
        description: "En el Dashboard, mantén presionado el ícono de arrastre (⠿) de un widget y arrástralo a la posición que prefieras.",
        selector: "[data-tutorial='customize-btn']",
        position: "bottom",
      },
      {
        title: "Gestionar accesos rápidos",
        description: "En el personalizador también puedes activar o desactivar cuáles accesos rápidos aparecen en la fila horizontal.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Guardado automático",
        description: "Todos los cambios de layout se guardan automáticamente y se sincronizan con tu perfil.",
        selector: "[data-tutorial='customize-btn']",
        position: "bottom",
      },
    ],
  },
];

// ─── Spotlight ─────────────────────────────────────────────────────────────────

interface SpotlightProps {
  selector?: string;
  onRectReady: (rect: DOMRect | null) => void;
}

function Spotlight({ selector, onRectReady }: SpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const animFrameRef = useRef<number>(0);

  const measure = useCallback(() => {
    if (!selector) { setRect(null); onRectReady(null); return; }
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) { setRect(null); onRectReady(null); return; }
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // Wait for scroll to settle before measuring
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect(r);
      onRectReady(r);
    }, 320);
  }, [selector, onRectReady]);

  useEffect(() => {
    measure();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [measure]);

  const PAD = 10;
  const RADIUS = 14;

  return (
    <>
      {/* Dark overlay with cutout via box-shadow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={
          rect
            ? {
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                borderRadius: RADIUS,
                boxShadow:
                  "0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 2px rgba(99,102,241,0.9), 0 0 28px 6px rgba(99,102,241,0.45)",
              }
            : { top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.78)" }
        }
      />
    </>
  );
}

// ─── Step Tooltip ──────────────────────────────────────────────────────────────

interface TooltipProps {
  step: TutorialStep;
  stepIndex: number;
  total: number;
  tutorialTitle: string;
  rect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

function StepTooltip({ step, stepIndex, total, tutorialTitle, rect, onNext, onPrev, onClose }: TooltipProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;
  const CARD_W = 320;
  const CARD_MARGIN = 16;

  const getStyle = (): React.CSSProperties => {
    if (!rect) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: CARD_W };
    }
    const pos = step.position ?? "bottom";
    const centeredLeft = Math.max(
      CARD_MARGIN,
      Math.min(rect.left + rect.width / 2 - CARD_W / 2, window.innerWidth - CARD_W - CARD_MARGIN)
    );

    if (pos === "bottom") {
      const top = rect.bottom + 16;
      if (top + 220 > window.innerHeight) {
        // Flip to top if not enough space below
        return { position: "fixed", bottom: window.innerHeight - rect.top + 16, left: centeredLeft, width: CARD_W };
      }
      return { position: "fixed", top, left: centeredLeft, width: CARD_W };
    }
    // top
    const bottom = window.innerHeight - rect.top + 16;
    return { position: "fixed", bottom, left: centeredLeft, width: CARD_W };
  };

  return (
    <motion.div
      key={stepIndex}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="z-[10000] bg-theme-surface border border-white/10 rounded-2xl shadow-2xl p-4"
      style={getStyle()}
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial: ${step.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <p className="text-[9px] font-black text-theme-brand uppercase tracking-[0.2em] opacity-70 mb-0.5">{tutorialTitle}</p>
          <h3 className="text-sm font-black text-theme-primary leading-tight">{step.title}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar tutorial"
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Description */}
      <p className="text-[12px] text-theme-secondary leading-relaxed mb-4">{step.description}</p>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stepIndex ? "w-6 bg-theme-brand" : i < stepIndex ? "w-1.5 bg-theme-brand/40" : "w-1.5 bg-white/15"
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-theme-secondary hover:text-theme-primary transition-all text-[11px] font-black"
        >
          <ChevronLeft size={13} />
          Anterior
        </button>

        <span className="text-[10px] text-theme-secondary opacity-50 font-black">
          {stepIndex + 1} / {total}
        </span>

        {isLast ? (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-brand text-white text-[11px] font-black hover:opacity-90 transition-opacity"
          >
            <CheckCircle2 size={13} />
            Finalizar
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-brand text-white text-[11px] font-black hover:opacity-90 transition-opacity"
          >
            Siguiente
            <ChevronRight size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tutorial List ─────────────────────────────────────────────────────────────

interface TutorialListProps {
  onSelect: (id: string) => void;
  onClose: () => void;
}

function TutorialList({ onSelect, onClose }: TutorialListProps) {
  return (
    <div className="fixed inset-0 z-[9997] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Lista de tutoriales">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 w-full max-w-lg bg-theme-surface border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl pb-safe"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-theme-brand/15 border border-theme-brand/20 flex items-center justify-center">
              <GraduationCap size={20} className="text-theme-brand" />
            </div>
            <div>
              <h2 className="text-sm font-black text-theme-primary">Tutoriales</h2>
              <p className="text-[10px] text-theme-secondary opacity-60">{TUTORIALS.length} guías disponibles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar tutoriales"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tutorial list */}
        <div className="overflow-y-auto max-h-[65vh] no-scrollbar p-3">
          <div className="grid grid-cols-1 gap-2">
            {TUTORIALS.map((tut, idx) => (
              <motion.button
                key={tut.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => onSelect(tut.id)}
                className="flex items-center gap-4 p-3.5 bg-white/3 hover:bg-white/6 active:bg-white/8 border border-white/5 hover:border-theme-brand/20 rounded-2xl text-left transition-all group"
              >
                <div className="w-11 h-11 rounded-2xl bg-theme-bg flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {tut.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-theme-primary leading-tight truncate">{tut.title}</p>
                  <p className="text-[10px] text-theme-secondary opacity-60 mt-0.5 truncate">{tut.description}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 text-[9px] text-theme-secondary opacity-40 font-black">
                  <span>{tut.steps.length}</span>
                  <span>pasos</span>
                  <ChevronRight size={11} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main TutorialSystem ───────────────────────────────────────────────────────

export function TutorialSystem({ onClose }: TutorialSystemProps) {
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const activeTutorial = TUTORIALS.find((t) => t.id === activeTutorialId) ?? null;
  const currentStep = activeTutorial?.steps[stepIndex] ?? null;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeTutorialId) {
          setActiveTutorialId(null);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowRight" && activeTutorial && stepIndex < activeTutorial.steps.length - 1) {
        setStepIndex((s) => s + 1);
      }
      if (e.key === "ArrowLeft" && stepIndex > 0) {
        setStepIndex((s) => s - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeTutorialId, activeTutorial, stepIndex, onClose]);

  const handleSelectTutorial = (id: string) => {
    setActiveTutorialId(id);
    setStepIndex(0);
    setSpotlightRect(null);
  };

  const handleBack = () => {
    setActiveTutorialId(null);
    setSpotlightRect(null);
  };

  const handleNext = () => {
    if (!activeTutorial) return;
    if (stepIndex < activeTutorial.steps.length - 1) {
      setStepIndex((s) => s + 1);
      setSpotlightRect(null);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
      setSpotlightRect(null);
    }
  };

  return (
    <>
      {!activeTutorialId ? (
        <TutorialList onSelect={handleSelectTutorial} onClose={onClose} />
      ) : (
        currentStep && (
          <>
            <Spotlight
              selector={currentStep.selector}
              onRectReady={setSpotlightRect}
            />
            {/* Clickable backdrop to return to list */}
            <div
              className="fixed inset-0 z-[9999] cursor-pointer"
              onClick={handleBack}
              aria-label="Volver a la lista"
            />
            <StepTooltip
              step={currentStep}
              stepIndex={stepIndex}
              total={activeTutorial.steps.length}
              tutorialTitle={activeTutorial.title}
              rect={spotlightRect}
              onNext={handleNext}
              onPrev={handlePrev}
              onClose={handleBack}
            />
          </>
        )
      )}
    </>
  );
}
