import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, CheckCircle2, X, ExternalLink, Sparkles, ShieldCheck, HelpCircle, ArrowRight, Laptop } from 'lucide-react';

export const DesktopInstallModal: React.FC = () => {
  const { isInstallable, isStandalone, isInstalled, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Detect if inside an iframe (like AI Studio preview pane)
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  const handleOpenDirect = () => {
    // URL direct access outside iframe
    const devUrl = "https://ais-dev-xgvqxbx6w3ku2emun3rz6k-664528717721.europe-west1.run.app";
    window.open(devUrl, '_blank');
  };

  const handleTriggerInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Botón Principal en la Barra Superior */}
      <button
        id="btn-install-browser-app"
        type="button"
        onClick={handleTriggerInstall}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer border border-orange-400/40 animate-pulse hover:animate-none"
        title="Instalar PlasmaNGC Studio directamente en Windows 11 desde el navegador"
      >
        <Download className="w-4 h-4" />
        <span>Instalar en Windows 11</span>
      </button>

      {/* Modal Explicativo con los 2 Pasos Reales en Chrome */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-xl w-full p-6 shadow-2xl space-y-4 text-stone-900 animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] overflow-y-auto">
            
            {/* Cabecera */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Por qué Chrome no mostraba el botón y cómo solucionarlo
                  </h3>
                  <p className="text-xs text-stone-500">
                    Explicación clara en 30 segundos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CAUSA CLAVE: El marco iFrame de AI Studio */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <span className="text-sm">¿Por qué Chrome no te mostraba las opciones de instalar?</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                Por seguridad estricta, <strong>Google Chrome y Edge desactivan automáticamente la opción de «Instalar»</strong> si estás viendo una página web dentro de una ventana incrustada (*iframe* de Google AI Studio). Chrome requiere que la web esté en su <strong>propia pestaña completa</strong> con barra de dirección real.
              </p>
              
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenDirect}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>PASO 1: Haz clic aquí para Abrir en Pestaña Completa</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PASO 2: Exactamente cómo aparece en Chrome y Edge */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>PASO 2: Una vez abierta la pestaña completa, haz esto:</span>
              </div>

              {/* Chrome detallado en Inglés y Español */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">G</div>
                  <span>En Google Chrome (Windows 11 en Inglés):</span>
                </div>
                
                <div className="text-xs text-stone-700 space-y-2 leading-relaxed">
                  <div className="p-3 bg-white rounded-lg border-2 border-orange-400 space-y-1.5">
                    <strong className="text-stone-900 block font-bold text-xs text-orange-950">
                      ★ Hazlo con "Create shortcut..." (Exactamente como te sale en Chrome):
                    </strong>
                    <ol className="list-decimal list-inside space-y-1 text-stone-800 text-[11px]">
                      <li>
                        Haz clic en los <strong>tres puntos ⋮</strong> arriba a la derecha de Chrome.
                      </li>
                      <li>
                        Pasa el ratón sobre <strong>"Save and share"</strong> (o <em>"More tools"</em>).
                      </li>
                      <li>
                        Haz clic en <strong>"Create shortcut..."</strong>.
                      </li>
                      <li>
                        <span className="text-orange-700 font-bold bg-orange-50 px-1 py-0.5 rounded border border-orange-300">
                          ¡MUY IMPORTANTE!
                        </span> Marca la casilla que dice <strong>☑ "Open as window"</strong>.
                      </li>
                      <li>
                        Pulsa el botón <strong>"Create"</strong>.
                      </li>
                    </ol>
                    <p className="text-[11px] text-emerald-700 font-medium pt-1">
                      ✓ ¡Listo! Al marcar <em>"Open as window"</em>, Chrome crea el icono de PlasmaNGC en tu Escritorio de Windows 11 y lo convierte en una aplicación nativa completa independiente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Edge detallado */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">E</div>
                  <span>En Microsoft Edge (Nativo de Windows 11):</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  En Edge aparece directamente el icono de <strong>Aplicación disponible [+]</strong> en la barra de URL. Haces clic en <strong>Instalar</strong> y Edge te crea de inmediato el icono en tu Escritorio de Windows y en la barra de tareas.
                </p>
              </div>

              {/* Beneficio de la app instalada */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>¿El resultado final?</strong> Tendrás el programa en tu Escritorio de Windows 11 con su propio icono, sin navegadores de por medio, abriéndose al instante y funcionando sin internet en el taller.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
