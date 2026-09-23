import React from 'react';
import { FontStyleType } from '../types';
import { Type, Sparkles, AlertCircle, Layers } from 'lucide-react';

interface TextInputPanelProps {
  text: string;
  onTextChange: (val: string) => void;
  fontType: FontStyleType;
  onFontTypeChange: (type: FontStyleType) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  letterSpacing: number;
  onLetterSpacingChange: (spacing: number) => void;
  lineSpacing: number;
  onLineSpacingChange: (spacing: number) => void;
  unit: 'mm' | 'inch';
}

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  text,
  onTextChange,
  fontType,
  onFontTypeChange,
  fontSize,
  onFontSizeChange,
  letterSpacing,
  onLetterSpacingChange,
  lineSpacing,
  onLineSpacingChange,
  unit
}) => {
  const quickPhrases = [
    'LINUXCNC PLASMA',
    'TALLER METAL',
    'CHAPA 3MM',
    'CNC 2026',
    'PELIGRO ALTO VOLTAJE'
  ];

  return (
    <div id="text-input-panel" className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-semibold text-stone-900">Texto para CNC Plasma</h2>
        </div>
        <span className="text-[11px] text-stone-500 font-medium">Formato NGC</span>
      </div>

      {/* Text Area */}
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1.5">
          Escribe el texto a cortar:
        </label>
        <textarea
          id="plasma-text-input"
          value={text}
          onChange={e => onTextChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-mono text-sm uppercase tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          placeholder="ESCRIBE TU TEXTO AQUI..."
        />
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[11px] text-stone-400 font-medium mr-1">Ejemplos:</span>
        {quickPhrases.map(phrase => (
          <button
            key={phrase}
            type="button"
            onClick={() => onTextChange(phrase)}
            className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-[11px] font-mono text-stone-700 transition-colors"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Font Type Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-stone-700">
          Tipo de Letra para Plasma:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Stencil Font */}
          <button
            type="button"
            onClick={() => onFontTypeChange('stencil')}
            className={`p-3 rounded-lg border text-left transition-all ${
              fontType === 'stencil'
                ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                : 'border-stone-200 hover:border-stone-300 bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-900">Stencil Plasma (Con Puentes)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-medium">
                Recomendado
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-snug">
              Ideal para corte pasante en chapa. Las letras A, B, D, O, P, Q, R, 0, etc. incluyen puentes de retención para que no se caigan los centros metálicos.
            </p>
          </button>

          {/* Single Line / Hershey */}
          <button
            type="button"
            onClick={() => onFontTypeChange('single_line')}
            className={`p-3 rounded-lg border text-left transition-all ${
              fontType === 'single_line'
                ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                : 'border-stone-200 hover:border-stone-300 bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-900">Línea Simple (Hershey)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-medium">
                Trazo único
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-snug">
              Para marcado superficial o corte rápido de línea única sin doble contorno. Ahorra gas y tiempo de máquina.
            </p>
          </button>
        </div>
      </div>

      {/* Sizing & Spacing Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-600 font-medium">Altura de Letra:</span>
            <span className="font-mono text-stone-900 font-semibold">{fontSize} {unit}</span>
          </div>
          <input
            type="range"
            min="10"
            max="250"
            step="5"
            value={fontSize}
            onChange={e => onFontSizeChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-600 font-medium">Espaciado Letras:</span>
            <span className="font-mono text-stone-900 font-semibold">{letterSpacing} {unit}</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={letterSpacing}
            onChange={e => onLetterSpacingChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-600 font-medium">Interlineado:</span>
            <span className="font-mono text-stone-900 font-semibold">{lineSpacing}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.1"
            value={lineSpacing}
            onChange={e => onLineSpacingChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
      </div>

      {/* Character validity notice */}
      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2 text-[11px] text-emerald-800">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Caracteres verificados para LinuxCNC:</span> Letras mayúsculas (A-Z), Ñ, números (0-9), guiones (-), signos (+) y puntuación con puentes de soporte físico para corte térmico de plasma.
        </div>
      </div>
    </div>
  );
};
