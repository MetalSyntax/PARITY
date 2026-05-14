import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { X, ChevronLeft, ChevronRight, GraduationCap, CheckCircle2, MousePointer2, Trophy, Receipt, TrendingUp, ArrowRightLeft, Landmark, Tag, PieChart, BarChart3, Repeat2, Upload, LayoutDashboard } from "lucide-react";

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TutorialStep {
  title: string;
  description: string;
  selector?: string;
  navigateTo?: string;
  waitForClick?: boolean;
  position?: "top" | "bottom";
}

interface Tutorial {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  description: string;
  steps: TutorialStep[];
}

interface TutorialSystemProps {
  onClose: () => void;
  onNavigate: (view: string) => void;
  lang?: string;
}

type Phase = "list" | "running" | "exit-confirm" | "complete";

const PAD = 10;

// ─── Tutorial Definitions ──────────────────────────────────────────────────────

const TUTORIALS: Tutorial[] = [
  {
    id: "record-expense",
    title: "Registrar un gasto",
    icon: Receipt,
    iconColor: "text-red-400",
    description: "Registra tus gastos diarios fácilmente",
    steps: [
      {
        title: "Botón de nueva transacción",
        description: "El botón + al centro de la barra inferior es tu acceso principal. Tócalo para abrir el formulario de transacción.",
        selector: "[data-tutorial='fab-add']",
        navigateTo: "DASHBOARD",
        waitForClick: true,
        position: "top",
      },
      {
        title: "Tipo: Gasto (por defecto)",
        description: "Al abrir el formulario, \"Gasto\" ya está seleccionado. El punto rojo indica el tipo activo. No necesitas cambiarlo.",
        selector: "[data-tutorial='tx-type-expense']",
        position: "bottom",
      },
      {
        title: "Ingresa el monto",
        description: "Usa el teclado numérico para escribir el monto. Toca el símbolo de moneda para cambiar entre USD, Bs y EUR.",
        selector: "[data-tutorial='tx-amount-input']",
        position: "bottom",
      },
      {
        title: "Confirma el gasto",
        description: "Selecciona la categoría, agrega una nota opcional con el nombre del comercio y toca Guardar. El balance se actualizará.",
        selector: "[data-tutorial='tx-save-btn']",
        position: "top",
      },
    ],
  },
  {
    id: "record-income",
    title: "Registrar un ingreso",
    icon: TrendingUp,
    iconColor: "text-emerald-400",
    description: "Aprende a agregar tus fuentes de ingresos",
    steps: [
      {
        title: "Abrir formulario",
        description: "Toca el botón + en la barra inferior para abrir el formulario de transacción.",
        selector: "[data-tutorial='fab-add']",
        navigateTo: "DASHBOARD",
        waitForClick: true,
        position: "top",
      },
      {
        title: "Selecciona Ingreso",
        description: "Toca el botón \"Ingreso\" en la parte superior del formulario. El punto verde indicará que este tipo está activo.",
        selector: "[data-tutorial='tx-type-income']",
        waitForClick: true,
        position: "bottom",
      },
      {
        title: "Ingresa el monto",
        description: "Escribe el monto recibido con el teclado numérico. Puedes seleccionar la moneda en la que recibiste el pago.",
        selector: "[data-tutorial='tx-amount-input']",
        position: "bottom",
      },
      {
        title: "Guarda el ingreso",
        description: "Selecciona la categoría (Salario, Freelance, Inversiones…), agrega nota opcional y toca Guardar.",
        selector: "[data-tutorial='tx-save-btn']",
        position: "top",
      },
    ],
  },
  {
    id: "create-transfer",
    title: "Transferencia entre cuentas",
    icon: ArrowRightLeft,
    iconColor: "text-blue-400",
    description: "Mueve dinero entre tus wallets",
    steps: [
      {
        title: "Accesos rápidos",
        description: "Los accesos rápidos del Dashboard llevan directamente a las funciones más usadas. Desliza para ver todas las opciones disponibles.",
        selector: "[data-tutorial='quick-actions']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
      {
        title: "Abrir formulario",
        description: "Toca el botón + para abrir el formulario de transacción. Desde aquí puedes crear gastos, ingresos y transferencias.",
        selector: "[data-tutorial='fab-add']",
        waitForClick: true,
        position: "top",
      },
      {
        title: "Selecciona Transferencia",
        description: "Toca el botón \"Transferencia\" para activar los campos de cuenta origen y destino.",
        selector: "[data-tutorial='tx-type-transfer']",
        waitForClick: true,
        position: "bottom",
      },
      {
        title: "Confirmar transferencia",
        description: "Selecciona cuenta origen, cuenta destino y el monto. Si son de diferente moneda, la conversión es automática. Toca Guardar.",
        selector: "[data-tutorial='tx-save-btn']",
        position: "top",
      },
    ],
  },
  {
    id: "add-account",
    title: "Agregar cuenta bancaria",
    icon: Landmark,
    iconColor: "text-violet-400",
    description: "Crea y gestiona tus cuentas y wallets",
    steps: [
      {
        title: "Accesos rápidos del Dashboard",
        description: "Desde los accesos rápidos puedes acceder al módulo Wallet para gestionar todas tus cuentas bancarias y billeteras digitales.",
        selector: "[data-tutorial='quick-actions']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
      {
        title: "Widget de Balance",
        description: "El widget de balance muestra tu patrimonio neto total calculado en tu moneda de visualización (USD, Bs o EUR).",
        selector: "[data-label='balanceChart']",
        position: "bottom",
      },
      {
        title: "Personalizar el Dashboard",
        description: "Usa el botón de Widgets para activar, desactivar y reordenar los widgets que aparecen en tu Dashboard.",
        selector: "[data-tutorial='customize-btn']",
        position: "bottom",
      },
    ],
  },
  {
    id: "categorize-transaction",
    title: "Categorizar transacciones",
    icon: Tag,
    iconColor: "text-amber-400",
    description: "Organiza tus movimientos por categorías",
    steps: [
      {
        title: "Abrir formulario",
        description: "Toca el botón + para registrar una transacción. Al escribir el nombre del comercio en la nota, la categoría se asigna sola.",
        selector: "[data-tutorial='fab-add']",
        navigateTo: "DASHBOARD",
        waitForClick: true,
        position: "top",
      },
      {
        title: "Tipo de transacción",
        description: "La detección automática funciona para gastos principalmente. Prueba escribir \"McDonald's\", \"Uber\" o \"Netflix\" en la nota.",
        selector: "[data-tutorial='tx-type-expense']",
        position: "bottom",
      },
      {
        title: "Estructura de Gastos",
        description: "El widget de Estructura de Gastos muestra la distribución de tus gastos por categoría. Toca cualquier segmento para el detalle.",
        selector: "[data-label='expenses']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
    ],
  },
  {
    id: "set-budget",
    title: "Establecer un presupuesto",
    icon: PieChart,
    iconColor: "text-orange-400",
    description: "Controla tus gastos con límites mensuales",
    steps: [
      {
        title: "Accesos rápidos",
        description: "Desde los accesos rápidos del Dashboard accede al módulo de Presupuestos para crear y gestionar tus límites de gasto por categoría.",
        selector: "[data-tutorial='quick-actions']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
      {
        title: "Botón de Widgets",
        description: "Activa el widget de Pronóstico desde el personalizador para ver alertas inteligentes cuando te acerques al límite de un presupuesto.",
        selector: "[data-tutorial='customize-btn']",
        position: "bottom",
      },
      {
        title: "Sincronización",
        description: "Cuando tus presupuestos estén configurados, sincroniza con la nube para respaldarlo todo de forma cifrada.",
        selector: "[data-tutorial='sync-btn']",
        position: "bottom",
      },
    ],
  },
  {
    id: "expense-report",
    title: "Reporte de gastos",
    icon: BarChart3,
    iconColor: "text-cyan-400",
    description: "Analiza tus gastos por categoría y período",
    steps: [
      {
        title: "Estructura de Gastos",
        description: "Este widget muestra tus categorías de gasto principales. Toca cualquier segmento del gráfico para ver el detalle de transacciones.",
        selector: "[data-label='expenses']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
      {
        title: "Ingresos vs Gastos",
        description: "El widget de Ingresos vs Gastos compara tus flujos mensuales con un gráfico de barras para cada mes del año.",
        selector: "[data-label='incomeVsExpense']",
        position: "bottom",
      },
      {
        title: "Vista de Análisis",
        description: "Desde los accesos rápidos accede a la vista de Análisis para reportes con filtros avanzados por fecha, categoría y tipo.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
    ],
  },
  {
    id: "recurring-transaction",
    title: "Transacciones recurrentes",
    icon: Repeat2,
    iconColor: "text-indigo-400",
    description: "Automatiza pagos y cobros fijos",
    steps: [
      {
        title: "Accesos rápidos",
        description: "Desde los accesos rápidos del Dashboard busca el ícono de Programados para gestionar pagos y cobros recurrentes como suscripciones.",
        selector: "[data-tutorial='quick-actions']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
      {
        title: "Configurar programación",
        description: "Crea un pago programado con monto, categoría y frecuencia: diario, semanal, mensual o anual. La app registra la transacción automáticamente.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Calendario financiero",
        description: "El acceso rápido de Calendario Financiero muestra todos tus compromisos programados en vista de calendario mensual.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
    ],
  },
  {
    id: "export-summary",
    title: "Exportar resumen financiero",
    icon: Upload,
    iconColor: "text-teal-400",
    description: "Comparte o respalda tus datos",
    steps: [
      {
        title: "Botón de sincronización",
        description: "El ícono de nube sincroniza y respalda todos tus datos cifrados en Google Drive. Tócalo cuando tengas conexión a internet.",
        selector: "[data-tutorial='sync-btn']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
      {
        title: "Exportar e Importar",
        description: "Desde los accesos rápidos puedes exportar en CSV (para Excel) o JSON (respaldo completo). También puedes generar un Reporte PDF visual.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Verificar actualizaciones",
        description: "Cuando hay una nueva versión disponible, este botón se ilumina en azul. Tócalo para actualizar y obtener las últimas mejoras.",
        selector: "[data-tutorial='customize-btn']",
        position: "bottom",
      },
    ],
  },
  {
    id: "customize-dashboard",
    title: "Personalizar el Dashboard",
    icon: LayoutDashboard,
    iconColor: "text-pink-400",
    description: "Organiza los widgets a tu gusto",
    steps: [
      {
        title: "Botón de personalización",
        description: "Toca este botón para abrir el personalizador del Dashboard donde puedes activar, desactivar y reordenar los widgets.",
        selector: "[data-tutorial='customize-btn']",
        navigateTo: "DASHBOARD",
        position: "bottom",
      },
      {
        title: "Gestionar accesos rápidos",
        description: "En la barra de accesos rápidos puedes deslizar para ver todas las opciones. Los accesos activos aparecen según tu configuración personal.",
        selector: "[data-tutorial='quick-actions']",
        position: "bottom",
      },
      {
        title: "Configuración general",
        description: "El botón de Ajustes da acceso a la configuración de perfil, seguridad, idioma, moneda y formato de fecha.",
        selector: "[data-tutorial='sync-btn']",
        position: "bottom",
      },
    ],
  },
];

// ─── Tutorial List ─────────────────────────────────────────────────────────────

function TutorialList({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9990] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Lista de tutoriales">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-theme-surface border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl pb-safe animate-in slide-in-from-bottom-4 duration-200">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 md:hidden" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center">
              <GraduationCap size={18} className="text-theme-brand" />
            </div>
            <div>
              <h2 className="text-[13px] font-black text-theme-primary">Tutoriales</h2>
              <p className="text-[10px] text-theme-secondary opacity-50">{TUTORIALS.length} guías interactivas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar tutoriales"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[65vh] no-scrollbar p-3">
          <div className="grid grid-cols-1 gap-1.5">
            {TUTORIALS.map((tut) => (
              <button
                key={tut.id}
                onClick={() => onSelect(tut.id)}
                className="flex items-center gap-3.5 p-3 bg-white/3 hover:bg-white/6 active:bg-white/8 border border-white/5 hover:border-theme-brand/20 rounded-2xl text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <tut.icon size={18} className={tut.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-theme-primary leading-tight">{tut.title}</p>
                  <p className="text-[10px] text-theme-secondary opacity-50 mt-0.5">{tut.description}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 text-[9px] text-theme-secondary opacity-30 font-black">
                  <span>{tut.steps.length}</span>
                  <span>pasos</span>
                  <ChevronRight size={10} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Completion Screen ─────────────────────────────────────────────────────────

function CompletionScreen({ tutorial, onBackToList, onClose }: { tutorial: Tutorial; onBackToList: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-80 bg-theme-surface border border-white/10 rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Trophy size={24} className="text-emerald-400" />
        </div>
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Tutorial completado</p>
        <h3 className="text-base font-black text-theme-primary mb-1">{tutorial.title}</h3>
        <p className="text-[11px] text-theme-secondary opacity-60 mb-5 leading-relaxed">
          Has completado todos los pasos de este tutorial. ¡Ya puedes aplicarlo en tu gestión financiera!
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onBackToList}
            className="w-full py-2.5 rounded-xl bg-theme-brand text-white font-black text-[12px] hover:opacity-90 transition-opacity"
          >
            Ver más tutoriales
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-theme-secondary font-black text-[12px] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main TutorialSystem ───────────────────────────────────────────────────────

export function TutorialSystem({ onClose, onNavigate }: TutorialSystemProps) {
  const [phase, setPhase] = useState<Phase>("list");
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [isReady, setIsReady] = useState(false);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Tutorial | null>(null);

  const activeTutorial = TUTORIALS.find((t) => t.id === activeTutorialId) ?? null;
  activeRef.current = activeTutorial;
  const currentStep = activeTutorial?.steps[stepIndex] ?? null;
  const isLastStep = activeTutorial ? stepIndex >= activeTutorial.steps.length - 1 : false;

  // Keyboard
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (phase === "running") setPhase("exit-confirm");
        else if (phase === "exit-confirm") setPhase("running");
        else if (phase === "list") onClose();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [phase, onClose]);

  // Step setup
  useEffect(() => {
    if (phase !== "running" || !activeTutorial || !currentStep) return;

    let cancelled = false;
    let removeClick: (() => void) | null = null;

    setTargetRect(null);
    setIsReady(false);

    const setup = async () => {
      if (currentStep.navigateTo) {
        onNavigate(currentStep.navigateTo);
        await sleep(700);
        if (cancelled) return;
      }

      if (!currentStep.selector) {
        setTargetRect(null);
        setIsReady(true);
        return;
      }

      let el: HTMLElement | null = null;
      for (let i = 0; i < 15; i++) {
        el = document.querySelector(currentStep.selector) as HTMLElement | null;
        if (el) break;
        await sleep(100);
        if (cancelled) return;
      }

      if (!el || cancelled) {
        setTargetRect(null);
        setIsReady(true);
        return;
      }

      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      await sleep(350);
      if (cancelled) return;

      setTargetRect(el.getBoundingClientRect());
      setIsReady(true);

      if (currentStep.waitForClick) {
        const handler = () => {
          if (cancelled) return;
          const tut = activeRef.current;
          if (!tut) return;
          setStepIndex((prev) => {
            const next = prev + 1;
            if (next >= tut.steps.length) {
              setPhase("complete");
              return prev;
            }
            return next;
          });
        };
        el.addEventListener("click", handler, { once: true });
        removeClick = () => el?.removeEventListener("click", handler);
      }
    };

    setup();

    return () => {
      cancelled = true;
      removeClick?.();
    };
  }, [phase, activeTutorialId, stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-measure on resize
  useEffect(() => {
    if (phase !== "running" || !currentStep?.selector) return;
    const handle = () => {
      const el = document.querySelector(currentStep.selector!) as HTMLElement | null;
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [phase, activeTutorialId, stepIndex, currentStep?.selector]);

  // Tooltip positioning
  useLayoutEffect(() => {
    if (!tooltipRef.current || !isReady) return;

    const vw = window.innerWidth;
    const isMobileLayout = vw < 640;
    const CARD_W = 316;
    const MARGIN = 16;
    const GAP = 14;
    const th = tooltipRef.current.offsetHeight;

    // ── Mobile: anchor to top or bottom depending on where the target is ──
    if (isMobileLayout) {
      // If target is in the bottom 50% (or no target), place card at the top
      // If target is in the top 50%, place card at the bottom above the nav bar
      const targetInBottomHalf = !targetRect || targetRect.top > window.innerHeight * 0.5;
      if (targetInBottomHalf) {
        setTooltipStyle({
          position: "fixed",
          top: 56,
          left: MARGIN,
          right: MARGIN,
          width: "auto",
          opacity: 1,
        });
      } else {
        setTooltipStyle({
          position: "fixed",
          bottom: 90,
          left: MARGIN,
          right: MARGIN,
          width: "auto",
          opacity: 1,
        });
      }
      return;
    }

    // ── Desktop: floating near the target ──
    if (!targetRect) {
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: CARD_W,
        opacity: 1,
      });
      return;
    }

    const centeredLeft = Math.max(
      MARGIN,
      Math.min(
        targetRect.left + targetRect.width / 2 - CARD_W / 2,
        window.innerWidth - CARD_W - MARGIN
      )
    );

    const tBottom = targetRect.bottom + PAD;
    const tTop = targetRect.top - PAD;
    const spaceBelow = window.innerHeight - tBottom - GAP;
    const spaceAbove = tTop - GAP;

    let style: React.CSSProperties;
    if (spaceBelow >= th || spaceBelow >= spaceAbove) {
      style = {
        position: "fixed",
        top: tBottom + GAP,
        left: centeredLeft,
        width: CARD_W,
        opacity: 1,
      };
    } else {
      style = {
        position: "fixed",
        bottom: window.innerHeight - tTop + GAP,
        left: centeredLeft,
        width: CARD_W,
        opacity: 1,
      };
    }
    setTooltipStyle(style);
  }, [targetRect, isReady, stepIndex, activeTutorialId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectTutorial = (id: string) => {
    setActiveTutorialId(id);
    setStepIndex(0);
    setTargetRect(null);
    setIsReady(false);
    setPhase("running");
  };

  const handleNext = () => {
    if (!activeTutorial) return;
    if (isLastStep) {
      setPhase("complete");
    } else {
      setStepIndex((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  };

  const handleBackToList = () => {
    setActiveTutorialId(null);
    setTargetRect(null);
    setIsReady(false);
    setPhase("list");
  };

  // ─── List screen ─────────────────────────────────────────────────────────────

  if (phase === "list") {
    return <TutorialList onSelect={handleSelectTutorial} onClose={onClose} />;
  }

  // ─── Completion screen ────────────────────────────────────────────────────────

  if (phase === "complete") {
    return (
      <CompletionScreen
        tutorial={activeTutorial!}
        onBackToList={handleBackToList}
        onClose={onClose}
      />
    );
  }

  // ─── Running + exit-confirm ───────────────────────────────────────────────────

  const t = targetRect ? targetRect.top - PAD : 0;
  const b = targetRect ? targetRect.bottom + PAD : 0;
  const l = targetRect ? targetRect.left - PAD : 0;
  const r = targetRect ? targetRect.right + PAD : 0;

  const overlayClick = () => setPhase("exit-confirm");
  const cls = "fixed z-[9990] bg-black/75 cursor-pointer";

  return (
    <>
      {/* 4-rect overlay */}
      {targetRect ? (
        <>
          <div className={cls} style={{ top: 0, left: 0, right: 0, height: Math.max(0, t) }} onClick={overlayClick} />
          <div className={cls} style={{ top: Math.max(0, t), left: 0, width: Math.max(0, l), height: Math.max(0, b - t) }} onClick={overlayClick} />
          <div className={cls} style={{ top: Math.max(0, t), left: r, right: 0, height: Math.max(0, b - t) }} onClick={overlayClick} />
          <div className={cls} style={{ top: b, left: 0, right: 0, bottom: 0 }} onClick={overlayClick} />
          <div
            aria-hidden="true"
            className="fixed z-[9991] pointer-events-none rounded-xl border-2 border-indigo-400/80"
            style={{
              top: t,
              left: l,
              width: r - l,
              height: b - t,
              boxShadow: "0 0 0 3px rgba(99,102,241,0.15), 0 0 28px 6px rgba(99,102,241,0.12)",
            }}
          />
        </>
      ) : (
        <div className={cls} style={{ inset: 0 }} onClick={overlayClick} />
      )}

      {/* Tooltip */}
      {isReady && currentStep && (
        <div
          ref={tooltipRef}
          className="z-[9993] bg-theme-surface border border-white/10 rounded-2xl shadow-2xl p-4"
          style={{ ...tooltipStyle, position: "fixed" }}
          role="dialog"
          aria-modal="true"
          aria-label={`Tutorial: ${currentStep.title}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-theme-brand uppercase tracking-[0.18em] opacity-70 mb-0.5 truncate">
                {activeTutorial!.title}
              </p>
              <h3 className="text-[13px] font-black text-theme-primary leading-tight">{currentStep.title}</h3>
            </div>
            <button
              onClick={() => setPhase("exit-confirm")}
              aria-label="Cerrar tutorial"
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-theme-secondary hover:text-theme-primary flex-shrink-0 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          <p className="text-[11px] text-theme-secondary leading-relaxed mb-3">{currentStep.description}</p>

          {currentStep.waitForClick && (
            <div className="flex items-center gap-2 mb-3 py-1.5 px-2.5 rounded-xl bg-theme-brand/10 border border-theme-brand/20">
              <MousePointer2 size={11} className="text-theme-brand flex-shrink-0" />
              <span className="text-[10px] text-theme-brand font-black">Toca el elemento resaltado para continuar</span>
            </div>
          )}

          <div className="flex items-center gap-1 mb-3">
            {activeTutorial!.steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "w-5 bg-theme-brand" : i < stepIndex ? "w-1 bg-theme-brand/40" : "w-1 bg-white/15"
                }`}
              />
            ))}
          </div>

          {!currentStep.waitForClick && (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePrev}
                disabled={stepIndex === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-theme-secondary hover:text-theme-primary transition-all text-[10px] font-black"
              >
                <ChevronLeft size={12} />
                Anterior
              </button>

              <span className="text-[9px] text-theme-secondary opacity-40 font-black tabular-nums">
                {stepIndex + 1} / {activeTutorial!.steps.length}
              </span>

              {isLastStep ? (
                <button
                  onClick={() => setPhase("complete")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-theme-brand text-white text-[10px] font-black hover:opacity-90 transition-opacity"
                >
                  <CheckCircle2 size={12} />
                  Finalizar
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-theme-brand text-white text-[10px] font-black hover:opacity-90 transition-opacity"
                >
                  Siguiente
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Exit confirm */}
      {phase === "exit-confirm" && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPhase("running")} />
          <div className="relative z-10 w-72 bg-theme-surface border border-white/10 rounded-2xl shadow-2xl p-5 animate-in zoom-in-95 duration-150">
            <h3 className="text-[13px] font-black text-theme-primary mb-2">¿Salir del tutorial?</h3>
            <p className="text-[11px] text-theme-secondary mb-4 leading-relaxed opacity-70">
              Tu progreso se perderá. Puedes reiniciar el tutorial cuando quieras desde el botón Tutoriales.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPhase("running")}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-theme-secondary text-[11px] font-black transition-colors"
              >
                Continuar
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-[11px] font-black transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
