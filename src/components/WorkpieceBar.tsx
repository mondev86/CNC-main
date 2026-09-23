import React, { useState } from 'react';
import { WorkpieceConfig, SheetPreset, STANDARD_SHEET_PRESETS, ToolpathData } from '../types';
import { AutoFitTextResult, AutoFitSvgResult } from '../utils/workpieceCalculator';
import { TableAlignmentModal } from './TableAlignmentModal';
import {
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Split,
  Eye,
  EyeOff,
  RotateCw,
  RotateCcw,
  Compass,
  HelpCircle,
  Move,
  Grid,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw as ResetIcon
} from 'lucide-react';

interface WorkpieceBarProps {
  workpiece: WorkpieceConfig;
  onWorkpieceChange: (cfg: WorkpieceConfig) => void;
  toolpath: ToolpathData;
  activeTab: 'text' | 'svg';
  text: string;
  onTextChange: (txt: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  autoFitTextResult?: AutoFitTextResult;
  autoFitSvgResult?: AutoFitSvgResult;
  onApplySvgAutoFit?: () => void;
  unit: 'mm' | 'inch';
}

export const WorkpieceBar: React.FC<WorkpieceBarProps> = ({
  workpiece,
  onWorkpieceChange,
  toolpath,
  activeTab,
  text,
  onTextChange,
  fontSize,
  onFontSizeChange,
  autoFitTextResult,
  autoFitSvgResult,
  onApplySvgAutoFit,
  unit
}) => {
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showAlignmentHelp, setShowAlignmentHelp] = useState<boolean>(false);
  const [showShiftMatrixPanel, setShowShiftMatrixPanel] = useState<boolean>(false);

  const bounds = toolpath?.bounds || { width: 0, height: 0, maxX: 0, maxY: 0, minX: 0, minY: 0 };
  const cutWidth = Math.round(bounds.width);
  const cutHeight = Math.round(bounds.height);

  const usableWidth = workpiece.width - workpiece.margin * 2;
  const usableHeight = workpiece.height - workpiece.margin * 2;

  const exceedsWidth = cutWidth > usableWidth;
  const exceedsHeight = cutHeight > usableHeight;
  const exceedsPizarra = exceedsWidth || exceedsHeight;

  const currentAngle = workpiece.rotationAngle || 0;
  const currentOffsetX = workpiece.offsetX || 0;
  const currentOffsetY = workpiece.offsetY || 0;
  const currentCols = workpiece.arrayCols || 1;
  const currentRows = workpiece.arrayRows || 1;
  const totalCopies = currentCols * currentRows;

  const currentPreset = STANDARD_SHEET_PRESETS.find(
    p => p.width === workpiece.width && p.height === workpiece.height
  );

  const handleSelectPreset = (preset: SheetPreset) => {
    onWorkpieceChange({
      ...workpiece,
      width: preset.width,
      height: preset.height
    });
  };

  const handleSetAngle = (deg: number) => {
    let norm = deg % 360;
    if (norm > 180) norm -= 360;
    if (norm < -180) norm += 360;
    onWorkpieceChange({
      ...workpiece,
      rotationAngle: norm
    });
  };

  const handleNudgeOffset = (deltaX: number, deltaY: number) => {
    onWorkpieceChange({
      ...workpiece,
      offsetX: Math.round((currentOffsetX + deltaX) * 10) / 10,
      offsetY: Math.round((currentOffsetY + deltaY) * 10) / 10
    });
  };

  const handleResetOffset = () => {
    onWorkpieceChange({
      ...workpiece,
      offsetX: 0,
      offsetY: 0
    });
  };

  const handleAutoFitTextSingle = () => {
    if (autoFitTextResult) {
      onFontSizeChange(autoFitTextResult.recommendedFontSize);
    }
  };

  const handleAutoFitTextSplit = () => {
    if (autoFitTextResult?.splitTextRecommendation && autoFitTextResult.splitFontSizeRecommendation) {
      onTextChange(autoFitTextResult.splitTextRecommendation);
      onFontSizeChange(autoFitTextResult.splitFontSizeRecommendation);
    }
  };

  return (
    <>
      <div
        id="workpiece-calculator-bar"
        className={`rounded-xl border p-4 transition-all space-y-3.5 ${
          exceedsPizarra
            ? 'bg-amber-50/80 border-amber-300 shadow-xs'
            : 'bg-white border-stone-200 shadow-xs'
        }`}
      >
        {/* Row 1: Title, current plate, standards and sheet presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${exceedsPizarra ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-stone-900">
                  Pizarra / Chapa de Trabajo
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-medium bg-stone-100 text-stone-700 border border-stone-200">
                  {workpiece.width} × {workpiece.height} {unit}
                </span>
                {totalCopies > 1 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    Matriz: {currentCols}×{currentRows} ({totalCopies} piezas)
                  </span>
                )}
                {currentPreset && (
                  <span className="text-[10px] text-stone-500 hidden sm:inline">
                    ({currentPreset.description})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Sheet Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-stone-500 font-medium mr-1">Estándares:</span>
            {STANDARD_SHEET_PRESETS.slice(0, 4).map(preset => {
              const isSelected = workpiece.width === preset.width && workpiece.height === preset.height;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowCustomModal(!showCustomModal)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                showCustomModal ? 'bg-orange-100 text-orange-800 font-semibold' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
              title="Medidas personalizadas de chapa o más formatos"
            >
              <Sliders className="w-3 h-3" />
              <span>Opciones</span>
            </button>

            <button
              type="button"
              onClick={() => onWorkpieceChange({ ...workpiece, enabled: !workpiece.enabled })}
              className={`p-1 rounded-md border text-[11px] transition-colors cursor-pointer ${
                workpiece.enabled
                  ? 'border-stone-300 text-stone-700 hover:bg-stone-100'
                  : 'border-stone-200 text-stone-400 hover:bg-stone-50'
              }`}
              title={workpiece.enabled ? 'Ocultar pizarra en el visualizador' : 'Mostrar pizarra en el visualizador'}
            >
              {workpiece.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Row 2: Angle & Position Controls (Offset & Nesting Matrix) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Angle Controls */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
              <Compass className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Ángulo:</span>
            </div>

            <div className="flex items-center gap-1">
              {[
                { label: '0°', deg: 0, title: 'Horizontal estándar' },
                { label: '45°', deg: 45, title: 'Diagonal 45°' },
                { label: '90°', deg: 90, title: 'Vertical 90°' },
                { label: '-45°', deg: -45, title: 'Diagonal invertida -45°' }
              ].map(item => (
                <button
                  key={item.deg}
                  type="button"
                  onClick={() => handleSetAngle(item.deg)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    currentAngle === item.deg
                      ? 'bg-orange-600 text-white font-bold shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                  title={item.title}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 border-l border-stone-200 pl-1.5">
              <button
                type="button"
                onClick={() => handleSetAngle(currentAngle - 15)}
                className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono flex items-center gap-0.5 cursor-pointer"
                title="Girar 15 grados antihorario"
              >
                <RotateCcw className="w-3 h-3" />
                <span>-15°</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAngle(currentAngle + 15)}
                className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-mono flex items-center gap-0.5 cursor-pointer"
                title="Girar 15 grados horario"
              >
                <RotateCw className="w-3 h-3" />
                <span>+15°</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-100/90 px-2 py-1 rounded-lg border border-stone-200">
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={currentAngle}
                onChange={e => handleSetAngle(parseInt(e.target.value, 10) || 0)}
                className="w-16 accent-orange-600 h-1.5 cursor-pointer"
                title="Ajuste fino de rotación (-180° a +180°)"
              />
              <div className="flex items-center">
                <input
                  type="number"
                  min="-180"
                  max="180"
                  value={currentAngle}
                  onChange={e => handleSetAngle(parseInt(e.target.value, 10) || 0)}
                  className="w-11 text-center text-xs font-mono font-bold bg-white border border-stone-300 rounded px-1 py-0.5"
                />
                <span className="text-xs font-semibold text-stone-600 ml-0.5">°</span>
              </div>
            </div>

            {/* Position and Matrix toggle button */}
            <div className="border-l border-stone-200 pl-2">
              <button
                type="button"
                onClick={() => setShowShiftMatrixPanel(!showShiftMatrixPanel)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  showShiftMatrixPanel || currentOffsetX !== 0 || currentOffsetY !== 0 || totalCopies > 1
                    ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold'
                    : 'border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title="Mover posición (X/Y) o multiplicar piezas para aprovechar material restante"
              >
                <Move className="w-3.5 h-3.5 text-orange-600" />
                <span>Mover X/Y & Matriz</span>
                {(currentOffsetX !== 0 || currentOffsetY !== 0 || totalCopies > 1) && (
                  <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
                )}
              </button>
            </div>
          </div>

          {/* Guide Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowAlignmentHelp(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors cursor-pointer shrink-0"
            title="Aprende cómo alinear en la mesa física con LinuxCNC o en el código"
          >
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>¿Cómo aprovechar material en la mesa?</span>
          </button>
        </div>

        {/* Panel Desplazamiento X/Y y Matriz de Piezas (Aprovechamiento de Material) */}
        {showShiftMatrixPanel && (
          <div className="p-3.5 bg-orange-50/50 border border-orange-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/70 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950">
                <Move className="w-4 h-4 text-orange-600" />
                <span>Aprovechamiento de Material: Desplazamiento X / Y y Matriz de Piezas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-600">
                  Desplazamiento actual: <strong className="font-mono text-stone-900">X: {currentOffsetX} mm, Y: {currentOffsetY} mm</strong>
                </span>
                {(currentOffsetX !== 0 || currentOffsetY !== 0) && (
                  <button
                    type="button"
                    onClick={handleResetOffset}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-stone-300 hover:bg-stone-100 rounded text-[11px] text-stone-700 cursor-pointer"
                    title="Restablecer desplazamiento a cero"
                  >
                    <ResetIcon className="w-3 h-3" />
                    <span>Cero (0,0)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Columna 1: Mover en sentido vertical / horizontal */}
              <div className="space-y-2.5 bg-white p-3 rounded-lg border border-orange-100">
                <div className="font-semibold text-stone-900 text-xs flex items-center justify-between">
                  <span>1. Desplazar pieza a sector libre (mm):</span>
                  <span className="text-[10px] text-stone-500 font-normal">Flechas: ±20mm o ±50mm</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 text-[11px] mb-1">
                      Desplazamiento Horizontal X ({unit}):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentOffsetX}
                        onChange={e => onWorkpieceChange({ ...workpiece, offsetX: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded font-mono text-xs font-bold text-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleNudgeOffset(-20, 0)}
                        className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Mover 20 mm hacia la izquierda"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeOffset(20, 0)}
                        className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Mover 20 mm hacia la derecha"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-600 text-[11px] mb-1">
                      Desplazamiento Vertical Y ({unit}):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentOffsetY}
                        onChange={e => onWorkpieceChange({ ...workpiece, offsetY: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded font-mono text-xs font-bold text-stone-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleNudgeOffset(0, -20)}
                        className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Mover 20 mm hacia abajo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudgeOffset(0, 20)}
                        className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Mover 20 mm hacia arriba (continuar perforando arriba)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-stone-500 font-medium">Saltos rápidos:</span>
                  {[
                    { label: '+50 mm en Y (Arriba)', dx: 0, dy: 50 },
                    { label: '+100 mm en Y (Arriba)', dx: 0, dy: 100 },
                    { label: '+100 mm en X (Derecha)', dx: 100, dy: 0 },
                    { label: '+200 mm en X (Derecha)', dx: 200, dy: 0 }
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleNudgeOffset(btn.dx, btn.dy)}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 rounded text-[10px] font-mono cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Columna 2: Matriz Multi-pieza (Nesting simple fila/columna) */}
              <div className="space-y-2.5 bg-white p-3 rounded-lg border border-orange-100">
                <div className="font-semibold text-stone-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5 text-orange-600" />
                    <span>2. Cortar varias piezas (Matriz en Chapa):</span>
                  </div>
                  {totalCopies > 1 && (
                    <button
                      type="button"
                      onClick={() => onWorkpieceChange({ ...workpiece, arrayCols: 1, arrayRows: 1 })}
                      className="text-[10px] text-orange-700 hover:underline cursor-pointer"
                    >
                      Solo 1 pieza
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1">Columnas (X):</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={currentCols}
                      onChange={e => onWorkpieceChange({ ...workpiece, arrayCols: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded font-mono text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1">Filas (Y):</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={currentRows}
                      onChange={e => onWorkpieceChange({ ...workpiece, arrayRows: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded font-mono text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1">Separación X ({unit}):</label>
                    <input
                      type="number"
                      min="0"
                      value={workpiece.arrayGapX !== undefined ? workpiece.arrayGapX : 10}
                      onChange={e => onWorkpieceChange({ ...workpiece, arrayGapX: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 text-[10px] mb-1">Separación Y ({unit}):</label>
                    <input
                      type="number"
                      min="0"
                      value={workpiece.arrayGapY !== undefined ? workpiece.arrayGapY : 10}
                      onChange={e => onWorkpieceChange({ ...workpiece, arrayGapY: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded font-mono text-xs text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-stone-500 font-medium">Patrones rápidos:</span>
                  {[
                    { label: '2 en horizontal (2×1)', cols: 2, rows: 1 },
                    { label: '3 en horizontal (3×1)', cols: 3, rows: 1 },
                    { label: '2 en vertical (1×2)', cols: 1, rows: 2 },
                    { label: 'Cuadrícula 2×2 (4 piezas)', cols: 2, rows: 2 }
                  ].map((mat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onWorkpieceChange({ ...workpiece, arrayCols: mat.cols, arrayRows: mat.rows })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        currentCols === mat.cols && currentRows === mat.rows
                          ? 'bg-orange-600 text-white font-bold border-orange-600'
                          : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
                      }`}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Workpiece Dimensions & Positioning Dropdown */}
        {showCustomModal && (
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-3 text-xs">
            <div className="font-semibold text-stone-800 text-[11px]">
              Formatos Estándar y Medidas de Chapa:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STANDARD_SHEET_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    workpiece.width === preset.width && workpiece.height === preset.height
                      ? 'border-orange-500 bg-orange-50/60 font-semibold text-orange-900'
                      : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="text-[11px] font-mono">{preset.name}</div>
                  <div className="text-[10px] text-stone-500 leading-tight mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">Ancho Chapa (X en {unit}):</label>
                <input
                  type="number"
                  value={workpiece.width}
                  onChange={e => onWorkpieceChange({ ...workpiece, width: Math.max(50, parseInt(e.target.value, 10) || 100) })}
                  className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">Alto Chapa (Y en {unit}):</label>
                <input
                  type="number"
                  value={workpiece.height}
                  onChange={e => onWorkpieceChange({ ...workpiece, height: Math.max(50, parseInt(e.target.value, 10) || 100) })}
                  className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">Margen Seguridad ({unit}):</label>
                <input
                  type="number"
                  value={workpiece.margin}
                  onChange={e => onWorkpieceChange({ ...workpiece, margin: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className="w-full px-2.5 py-1 bg-white border border-stone-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">Posición Base en Chapa:</label>
                <select
                  value={workpiece.positionMode}
                  onChange={e => onWorkpieceChange({ ...workpiece, positionMode: e.target.value as any })}
                  className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                >
                  <option value="origin_with_margin">Con margen (X:{workpiece.margin} Y:{workpiece.margin})</option>
                  <option value="center">Centrado en Chapa</option>
                  <option value="absolute_zero">Origen Cero Directo (0,0)</option>
                  <option value="manual_offset">Offset Manual Puro (X e Y)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">Pivote de Rotación:</label>
                <select
                  value={workpiece.rotationPivot || 'center'}
                  onChange={e => onWorkpieceChange({ ...workpiece, rotationPivot: e.target.value as any })}
                  className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                >
                  <option value="center">Centro de la figura (Recomendado)</option>
                  <option value="origin">Origen de coordenadas (0,0)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="chk-g10"
                  checked={Boolean(workpiece.useG10Rotation)}
                  onChange={e => onWorkpieceChange({ ...workpiece, useG10Rotation: e.target.checked })}
                  className="w-4 h-4 accent-orange-600 rounded"
                />
                <label htmlFor="chk-g10" className="text-[11px] text-stone-700 cursor-pointer">
                  Insertar comando <code className="font-mono bg-stone-200 px-1 rounded">G10 L2 P1 R...</code> en G-Code
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Row 3: Status Comparison & Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-stone-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {exceedsPizarra ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>NO ALCANZA EN LA PIZARRA</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    {totalCopies > 1
                      ? `Todas las ${totalCopies} piezas caben dentro de la pizarra`
                      : 'Cabe dentro de la pizarra'}
                  </span>
                </span>
              )}

              <span className="text-stone-600 text-[11px]">
                {totalCopies > 1 ? `Área de matriz (${totalCopies} piezas): ` : 'Corte: '}
                <strong className="font-mono text-stone-800">{cutWidth} × {cutHeight} {unit}</strong>
                {' '}(Área útil: <span className="font-mono text-stone-700">{usableWidth} × {usableHeight} {unit}</span>)
              </span>
            </div>

            {exceedsPizarra && (
              <p className="text-[11px] text-amber-900 leading-tight">
                {exceedsWidth && `• El ancho total (${cutWidth} mm) excede la chapa por ${cutWidth - usableWidth} mm.`}
                {exceedsHeight && ` • La altura total (${cutHeight} mm) excede la chapa por ${cutHeight - usableHeight} mm.`}
              </p>
            )}
          </div>

          {/* Action Buttons: Auto-Calculate Standard to Fit */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'text' && autoFitTextResult && totalCopies === 1 && (
              <>
                <button
                  type="button"
                  id="btn-autofit-standard"
                  onClick={handleAutoFitTextSingle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-xs shadow-xs transition-colors cursor-pointer"
                  title={`Calcula y ajusta la altura de letra a ${autoFitTextResult.recommendedFontSize} mm para que quepa en la chapa`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Ajustar a Estándar (Letra {autoFitTextResult.recommendedFontSize} mm)
                  </span>
                </button>

                {autoFitTextResult.splitTextRecommendation && autoFitTextResult.splitFontSizeRecommendation && (
                  <button
                    type="button"
                    id="btn-autofit-split"
                    onClick={handleAutoFitTextSplit}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium text-xs transition-colors cursor-pointer"
                    title="Divide el texto en 2 líneas para que las letras puedan ser más grandes y legibles"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>
                      En 2 líneas (Letra {autoFitTextResult.splitFontSizeRecommendation} mm)
                    </span>
                  </button>
                )}
              </>
            )}

            {activeTab === 'svg' && autoFitSvgResult && onApplySvgAutoFit && totalCopies === 1 && (
              <button
                type="button"
                id="btn-autofit-svg"
                onClick={onApplySvgAutoFit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-xs shadow-xs transition-colors cursor-pointer"
                title={`Escala el SVG a ${autoFitSvgResult.targetWidth} × ${autoFitSvgResult.targetHeight} mm para que quepa en la chapa`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Escalar SVG ({autoFitSvgResult.targetWidth} × {autoFitSvgResult.targetHeight} mm)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alignment and Angle Guide Modal */}
      <TableAlignmentModal
        isOpen={showAlignmentHelp}
        onClose={() => setShowAlignmentHelp(false)}
        currentAngle={currentAngle}
        onSelectAngle={handleSetAngle}
      />
    </>
  );
};
