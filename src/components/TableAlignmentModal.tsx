import React from 'react';
import { X, Compass, CheckCircle2, RotateCw, Sparkles, Terminal, HelpCircle, Move, Grid } from 'lucide-react';

interface TableAlignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAngle: number;
  onSelectAngle: (angle: number) => void;
}

export const TableAlignmentModal: React.FC<TableAlignmentModalProps> = ({
  isOpen,
  onClose,
  currentAngle,
  onSelectAngle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                ¿Cómo aprovechar el material y cortar más arriba o al lado?
              </h3>
              <p className="text-xs text-stone-500">
                Guía de taller para reubicar perforaciones y aprovechar retazos en LinuxCNC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-stone-700 text-sm">
          {/* Answer summary */}
          <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-orange-950 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Pregunta: Ya perforé abajo y quiero seguir perforando más arriba o al lado</span>
            </div>
            <p className="text-orange-900 leading-relaxed">
              Tienes dos formas extremadamente fáciles: <strong>hacer Touch-Off en la máquina (sin reexportar)</strong> o usar los controles de <strong>Desplazamiento X/Y y Matriz de esta App</strong>.
            </p>
          </div>

          {/* Método A: Touch-Off en Máquina */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">A</span>
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>Método Touch-Off en la Máquina (El más rápido en taller — ¡Sin tocar el archivo!)</span>
              </h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed pl-8">
              Si ya tienes tu archivo cargado en LinuxCNC (QtPlasmaC o Axis) y solo quieres repetir el corte en otra parte de la chapa:
            </p>
            <ol className="list-decimal list-inside pl-8 space-y-2 text-xs text-stone-700">
              <li>
                Mueve la antorcha con el <strong>Jog</strong> (teclas de flecha o joystick) hacia arriba o hacia la derecha, dejando unos <strong>5 a 10 mm de separación</strong> con respecto al corte anterior.
              </li>
              <li>
                Presiona el botón <strong>Touch-Off</strong> (Puesta a cero) y pon <code className="bg-stone-100 px-1.5 py-0.5 rounded font-mono font-bold text-stone-900">X = 0</code> e <code className="bg-stone-100 px-1.5 py-0.5 rounded font-mono font-bold text-stone-900">Y = 0</code>.
              </li>
              <li>
                ¡Listo! Presiona <strong>Run / Iniciar</strong> de nuevo. La máquina tomará ese punto como su nuevo origen y cortará exactamente ahí sin desperdiciar nada de chapa.
              </li>
            </ol>
          </div>

          {/* Método B: En esta App con Desplazamiento X/Y y Matriz */}
          <div className="space-y-2.5 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">B</span>
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Move className="w-4 h-4 text-orange-600" />
                <span>Método en la App: Control de Desplazamiento X / Y</span>
              </h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed pl-8">
              En el botón <strong>"Mover X/Y & Matriz"</strong> de la barra superior:
            </p>
            <ul className="list-disc list-inside pl-8 space-y-1.5 text-xs text-stone-700">
              <li>
                <strong>Hacia arriba (Vertical):</strong> Aumenta el valor <strong>Desplazamiento Y</strong> (o toca el botón <em>+50 mm en Y</em>). La pieza subirá en la pantalla para cortar en la zona superior libre.
              </li>
              <li>
                <strong>Hacia la derecha (Horizontal):</strong> Aumenta el valor <strong>Desplazamiento X</strong> para cortar a un lado.
              </li>
              <li>
                El visualizador te mostrará en tiempo real si cabe en la chapa o si toca el margen.
              </li>
            </ul>
          </div>

          {/* Método C: Matriz para cortar varias de una sola vez */}
          <div className="space-y-2.5 pt-3 border-t border-stone-200">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-stone-700 text-white flex items-center justify-center text-xs font-bold">C</span>
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-orange-600" />
                <span>Método Matriz: Llenar la chapa de un solo viaje</span>
              </h4>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed pl-8">
              Si quieres cortar 2, 3 o más piezas iguales aprovechando el material:
            </p>
            <p className="text-xs text-stone-700 pl-8">
              En la sección <strong>Matriz en Chapa</strong> puedes activar:
              <br />
              • <strong>2 en vertical (1×2)</strong>: Cortará una abajo y otra inmediatamente arriba.
              <br />
              • <strong>2 o 3 en horizontal</strong>: Cortará en fila horizontal aprovechando el ancho.
              <br />
              • Puedes definir la <strong>separación entre piezas (Gap)</strong>, típicamente de 8 a 10 mm para corte plasma.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Ángulo actual: <strong className="font-mono text-stone-800">{currentAngle}°</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
