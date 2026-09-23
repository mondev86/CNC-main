import React, { useState } from 'react';
import { ToolpathData, ControllerMode } from '../types';
import { Download, Copy, Check, FileCode, Clock, Scissors, Target, Maximize, Cpu } from 'lucide-react';

interface GCodeViewerProps {
  toolpath: ToolpathData;
  unit: 'mm' | 'inch';
  fileName?: string;
  controllerMode?: ControllerMode;
  workpiece?: import('../types').WorkpieceConfig;
}

export const GCodeViewer: React.FC<GCodeViewerProps> = ({
  toolpath,
  unit,
  fileName = 'corte_plasma.ngc',
  controllerMode = 'qtplasmac',
  workpiece
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(toolpath.gcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWithExt = (extension: '.ngc' | '.gcode' | '.txt') => {
    const baseName = fileName.replace(/\.(ngc|gcode|txt)$/i, '');
    const finalName = `${baseName}${extension}`;
    const blob = new Blob([toolpath.gcode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadNgc = () => handleDownloadWithExt('.ngc');

  const gcodeLines = toolpath.gcode.split('\n');
  const minutes = Math.floor(toolpath.estimatedTimeSeconds / 60);
  const seconds = toolpath.estimatedTimeSeconds % 60;

  const usableW = workpiece ? workpiece.width - workpiece.margin * 2 : 10000;
  const usableH = workpiece ? workpiece.height - workpiece.margin * 2 : 10000;
  const exceedsTable = workpiece?.enabled && (toolpath.bounds.width > usableW || toolpath.bounds.height > usableH);

  return (
    <div id="gcode-viewer-container" className="flex flex-col h-full bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
      {/* Exceeds Table Alert in G-Code viewer */}
      {exceedsTable && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>⚠️ ATENCIÓN: El diseño actual sobrepasa los límites de tu chapa de trabajo ({workpiece.width}×{workpiece.height} mm).</span>
          </div>
          <span className="text-[11px] font-normal underline">Usa 'Ajustar a Mesa' o reduce las medidas antes de cortar</span>
        </div>
      )}

      {/* Quick Statistics Strip */}
      <div id="gcode-stats-strip" className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 border-b border-stone-200 text-xs">
        <div id="stat-dimensions" className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-stone-200/70 text-stone-700">
            <Maximize className="w-4 h-4" />
          </div>
          <div>
            <div className="text-stone-500 font-medium">Dimensiones</div>
            <div className="font-semibold text-stone-900 font-mono">
              {toolpath.bounds.width.toFixed(1)} × {toolpath.bounds.height.toFixed(1)} {unit}
            </div>
          </div>
        </div>

        <div id="stat-cut-length" className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="text-stone-500 font-medium">Longitud de Corte</div>
            <div className="font-semibold text-stone-900 font-mono">
              {toolpath.totalCutLength.toFixed(1)} {unit}
            </div>
          </div>
        </div>

        <div id="stat-pierces" className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-100 text-red-700">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-stone-500 font-medium">Perforaciones</div>
            <div className="font-semibold text-stone-900 font-mono">
              {toolpath.pierceCount} pierces
            </div>
          </div>
        </div>

        <div id="stat-time" className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-stone-500 font-medium">Tiempo Estimado</div>
            <div className="font-semibold text-stone-900 font-mono">
              ~{minutes}m {seconds}s
            </div>
          </div>
        </div>
      </div>

      {/* Code Header & Action Buttons */}
      <div id="gcode-actions-bar" className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <FileCode className="w-4 h-4 text-stone-600" />
          <span className="font-medium text-sm text-stone-800 font-mono">{fileName}</span>
          <span className="text-xs text-stone-500">({gcodeLines.length} líneas)</span>
          {controllerMode === 'qtplasmac' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800 border border-orange-200" title="Perfil QtPlasmaC Modo 0: Sin movimientos Z en el archivo G-code. QtPlasmaC gestiona alturas y THC.">
              <Cpu className="w-3 h-3 text-orange-600" />
              QtPlasmaC (Sin Z)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200" title="Perfil Estándar con alturas de Z incluidas en el G-code.">
              Estándar (Con Z)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            id="btn-copy-gcode"
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors"
            title="Copiar código G completo al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <div className="flex items-center rounded-lg border border-stone-300 overflow-hidden bg-stone-50 text-xs">
            <button
              id="btn-download-ngc"
              type="button"
              onClick={handleDownloadNgc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors cursor-pointer"
              title="Descargar archivo .NGC para LinuxCNC (Axis, Gmoccapy)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.NGC (LinuxCNC)</span>
            </button>
            <button
              id="btn-download-gcode"
              type="button"
              onClick={() => handleDownloadWithExt('.gcode')}
              className="px-2.5 py-1.5 hover:bg-stone-200 text-stone-700 font-medium transition-colors border-l border-stone-300 cursor-pointer"
              title="Descargar como .GCODE estándar universal"
            >
              .GCODE
            </button>
            <button
              id="btn-download-txt"
              type="button"
              onClick={() => handleDownloadWithExt('.txt')}
              className="px-2.5 py-1.5 hover:bg-stone-200 text-stone-700 font-medium transition-colors border-l border-stone-300 cursor-pointer"
              title="Descargar como .TXT (texto para Bloc de Notas de Windows)"
            >
              .TXT
            </button>
          </div>
        </div>
      </div>

      {/* Info Tip about CNC vs EXE files */}
      <div className="px-4 py-1.5 bg-stone-100/90 border-b border-stone-200 text-[11px] text-stone-600 flex items-center justify-between gap-2">
        <span>
          ℹ️ <strong>Formato CNC:</strong> Los archivos descargados son instrucciones de trayectoria en texto plano para LinuxCNC/Mach3. <em>No son programas ejecutables (.exe).</em>
        </span>
      </div>

      {/* G-Code Monospace Scrollable Area */}
      <div id="gcode-editor-area" className="flex-1 max-h-[380px] lg:max-h-[460px] overflow-y-auto bg-stone-950 text-stone-200 font-mono text-xs p-3 select-text">
        <div className="space-y-0.5">
          {gcodeLines.map((line, idx) => {
            const isComment = line.trim().startsWith('(') || line.trim().startsWith(';');
            const isMCode = /M\d+/i.test(line);
            const isGCode = /G[0-3]\b/i.test(line);
            const isG0 = /G0\b/i.test(line);

            return (
              <div key={idx} className="flex leading-5 hover:bg-stone-900/60 px-1 rounded-xs">
                <span className="w-10 text-stone-600 select-none text-right pr-3 shrink-0">
                  {idx + 1}
                </span>
                <span
                  className={
                    isComment
                      ? 'text-stone-500 italic'
                      : isMCode
                      ? 'text-red-400 font-semibold'
                      : isG0
                      ? 'text-sky-400'
                      : isGCode
                      ? 'text-amber-300'
                      : 'text-stone-200'
                  }
                >
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
