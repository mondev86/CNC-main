/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PlasmaConfig, FontStyleType, ToolpathData, WorkpieceConfig } from './types';
import { generateTextVectorLoops } from './utils/plasmaFonts';
import { parseSvgContent } from './utils/svgParser';
import { generatePlasmaToolpath } from './utils/gcodeGenerator';
import { SAMPLE_SVGS } from './utils/sampleSvgs';
import {
  calculateOptimalTextSize,
  calculateOptimalSvgDimensions,
  transformLoops
} from './utils/workpieceCalculator';
import { CanvasVisualizer } from './components/CanvasVisualizer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GCodeViewer } from './components/GCodeViewer';
import { TextInputPanel } from './components/TextInputPanel';
import { SvgConverterPanel } from './components/SvgConverterPanel';
import { PlasmaSettingsPanel } from './components/PlasmaSettingsPanel';
import { DesktopInstallModal } from './components/DesktopInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { WorkpieceBar } from './components/WorkpieceBar';
import { Type, FileCode, Settings2, Flame, Wrench, ShieldCheck, Laptop } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'svg'>('text');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Workpiece / Pizarra / Worktable configuration (Standard 600x400 mm for Debian QtPlasmaC & shop tables)
  const [workpiece, setWorkpiece] = useState<WorkpieceConfig>({
    enabled: true,
    width: 600,
    height: 400,
    margin: 20,
    positionMode: 'origin_with_margin',
    rotationAngle: 0,
    rotationPivot: 'center',
    useG10Rotation: false
  });

  // Text generator state
  const [text, setText] = useState<string>('LINUXCNC PLASMA');
  const [fontType, setFontType] = useState<FontStyleType>('stencil');
  const [fontSize, setFontSize] = useState<number>(38); // Standard size to fit in 600x400 with 20mm margin
  const [letterSpacing, setLetterSpacing] = useState<number>(4);
  const [lineSpacing, setLineSpacing] = useState<number>(1.3);

  // SVG converter state
  const [svgContent, setSvgContent] = useState<string>(SAMPLE_SVGS[0].svg);
  const [svgFileName, setSvgFileName] = useState<string>('soporte_escuadra.svg');
  const [targetWidth, setTargetWidth] = useState<number>(180);
  const [targetHeight, setTargetHeight] = useState<number>(120);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);

  // LinuxCNC Plasma machine configuration
  const [plasmaConfig, setPlasmaConfig] = useState<PlasmaConfig>({
    unit: 'mm',
    controllerMode: 'qtplasmac',
    cutFeedRate: 1800,
    rapidFeedRate: 6000,
    safeZ: 25.0,
    pierceHeightZ: 3.8,
    cutHeightZ: 1.5,
    pierceDelay: 0.6,
    torchOnCommand: 'M3 $0 S1',
    torchOffCommand: 'M5 $0',
    enableTouchOff: false,
    probeFeedRate: 400,
    switchOffset: 1.2,
    leadInType: 'straight',
    leadInLength: 3.0,
    leadInAngle: 45,
    leadOutLength: 1.5,
    kerfWidth: 1.2,
    g64Tolerance: 0.1
  });

  // Auto-fit calculations for text and SVG relative to the workpiece (considering rotation angle)
  const autoFitTextResult = useMemo(() => {
    return calculateOptimalTextSize(
      text,
      fontType,
      workpiece.width,
      workpiece.height,
      workpiece.margin,
      letterSpacing,
      lineSpacing,
      workpiece.rotationAngle || 0
    );
  }, [text, fontType, workpiece.width, workpiece.height, workpiece.margin, letterSpacing, lineSpacing, workpiece.rotationAngle]);

  const svgParsedInfo = useMemo(() => {
    return parseSvgContent(svgContent);
  }, [svgContent]);

  const autoFitSvgResult = useMemo(() => {
    return calculateOptimalSvgDimensions(
      svgParsedInfo.bounds.width,
      svgParsedInfo.bounds.height,
      workpiece.width,
      workpiece.height,
      workpiece.margin,
      workpiece.rotationAngle || 0
    );
  }, [svgParsedInfo.bounds.width, svgParsedInfo.bounds.height, workpiece.width, workpiece.height, workpiece.margin, workpiece.rotationAngle]);

  const handleApplySvgAutoFit = () => {
    if (autoFitSvgResult) {
      setTargetWidth(autoFitSvgResult.targetWidth);
      setTargetHeight(autoFitSvgResult.targetHeight);
    }
  };

  const handleAutoFitToWorkpiece = () => {
    if (activeTab === 'text') {
      if (autoFitTextResult) {
        setFontSize(autoFitTextResult.recommendedFontSize);
      }
    } else {
      handleApplySvgAutoFit();
    }
  };

  // Calculate toolpath with full trigonometric rotation, workpiece positioning & offsets
  const { toolpath, detectedPathsCount } = useMemo(() => {
    if (activeTab === 'text') {
      const textResult = generateTextVectorLoops(
        text.trim() || ' ',
        fontType,
        fontSize,
        letterSpacing,
        lineSpacing
      );

      const { transformedLoops } = transformLoops(
        textResult.loops,
        1.0,
        workpiece
      );

      const generated = generatePlasmaToolpath(
        transformedLoops,
        plasmaConfig,
        1.0,
        0,
        0,
        workpiece.useG10Rotation ? workpiece.rotationAngle : undefined
      );

      return {
        toolpath: generated,
        detectedPathsCount: textResult.loops.length
      };
    } else {
      // SVG mode
      const rawWidth = Math.max(1, svgParsedInfo.bounds.width);
      const rawHeight = Math.max(1, svgParsedInfo.bounds.height);
      const scaleX = targetWidth / rawWidth;
      const scaleY = targetHeight / rawHeight;
      const scale = lockAspectRatio ? Math.min(scaleX, scaleY) : scaleX;

      const { transformedLoops } = transformLoops(
        svgParsedInfo.paths,
        scale,
        workpiece
      );

      const generated = generatePlasmaToolpath(
        transformedLoops,
        plasmaConfig,
        1.0,
        0,
        0,
        workpiece.useG10Rotation ? workpiece.rotationAngle : undefined
      );

      return {
        toolpath: generated,
        detectedPathsCount: svgParsedInfo.paths.length
      };
    }
  }, [
    activeTab,
    text,
    fontType,
    fontSize,
    letterSpacing,
    lineSpacing,
    svgParsedInfo,
    targetWidth,
    targetHeight,
    lockAspectRatio,
    workpiece,
    plasmaConfig
  ]);

  const currentDownloadName = activeTab === 'text'
    ? `${text.slice(0, 12).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'texto'}_plasma.ngc`
    : svgFileName.replace(/\.svg$/i, '.ngc');

  return (
    <div id="plasma-app-root" className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Top Header */}
      <header id="app-header" className="bg-stone-900 text-white border-b border-stone-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div id="app-logo" className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  PlasmaNGC Studio
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-orange-400 font-mono font-medium border border-stone-700">
                  LinuxCNC G-Code
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Generador de trayectorias y código G (.ngc) para corte por plasma
              </p>
            </div>
          </div>

          {/* Actions and Mode Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
            {/* Mode Switcher Tabs */}
            <div id="mode-switcher" className="flex items-center bg-stone-800/90 p-1 rounded-xl border border-stone-700">
              <button
                id="tab-mode-text"
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Texto a NGC</span>
              </button>

              <button
                id="tab-mode-svg"
                type="button"
                onClick={() => setActiveTab('svg')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'svg'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>SVG a NGC</span>
              </button>

              <div className="w-px h-5 bg-stone-700 mx-1" />

              <button
                id="toggle-settings-btn"
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  showSettings
                    ? 'bg-stone-700 text-amber-300'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Ajustes de máquina"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Parámetros Plasma</span>
              </button>
            </div>

            {/* Direct Browser Installation */}
            <DesktopInstallModal />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Panel & Settings (5 cols) */}
          <div id="left-controls-column" className="lg:col-span-5 space-y-5">
            {activeTab === 'text' ? (
              <TextInputPanel
                text={text}
                onTextChange={setText}
                fontType={fontType}
                onFontTypeChange={setFontType}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                letterSpacing={letterSpacing}
                onLetterSpacingChange={setLetterSpacing}
                lineSpacing={lineSpacing}
                onLineSpacingChange={setLineSpacing}
                unit={plasmaConfig.unit}
              />
            ) : (
              <SvgConverterPanel
                svgContent={svgContent}
                onSvgChange={(newSvg, name) => {
                  setSvgContent(newSvg);
                  if (name) setSvgFileName(name);
                }}
                targetWidth={targetWidth}
                onTargetWidthChange={setTargetWidth}
                targetHeight={targetHeight}
                onTargetHeightChange={setTargetHeight}
                lockAspectRatio={lockAspectRatio}
                onLockAspectRatioChange={setLockAspectRatio}
                unit={plasmaConfig.unit}
                detectedPathsCount={detectedPathsCount}
                workpiece={workpiece}
                autoFitSvgResult={autoFitSvgResult}
                onApplySvgAutoFit={handleApplySvgAutoFit}
                currentCutWidth={toolpath.bounds.width}
                currentCutHeight={toolpath.bounds.height}
              />
            )}

            {/* Plasma Machine Parameters Panel */}
            <PlasmaSettingsPanel
              config={plasmaConfig}
              onChange={setPlasmaConfig}
            />

            {/* LinuxCNC Compliance info badge */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 text-xs text-stone-600 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {plasmaConfig.controllerMode === 'qtplasmac'
                    ? 'Compatibilidad Nativa LinuxCNC QtPlasmaC (Modo 0)'
                    : 'Compatibilidad LinuxCNC Estándar (Axis / Gmoccapy)'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-500">
                {plasmaConfig.controllerMode === 'qtplasmac'
                  ? 'G-Code limpio sin eje Z: Emite M3 $0 S1 y M5 $0. QtPlasmaC en Debian gestiona automáticamente el palpado IHS, pierce delay, altura de corte y THC mediante su tabla de materiales.'
                  : 'G-Code estándar: Incluye G90, G21/G20, G64 (trayectoria continua), control M3/M5, alturas Z de perforación/corte y ciclo opcional G38.2.'}
              </p>
            </div>
          </div>

          {/* Right Column: Visualizer & G-Code Inspector (7 cols) */}
          <div id="right-workspace-column" className="lg:col-span-7 space-y-5">
            {/* Workpiece & Physical Sheet Sizing Bar */}
            <WorkpieceBar
              workpiece={workpiece}
              onWorkpieceChange={setWorkpiece}
              toolpath={toolpath}
              activeTab={activeTab}
              text={text}
              onTextChange={setText}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              autoFitTextResult={autoFitTextResult}
              autoFitSvgResult={autoFitSvgResult}
              onApplySvgAutoFit={handleApplySvgAutoFit}
              unit={plasmaConfig.unit}
            />

            {/* 2D Interactive CAD/CAM Visualizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Simulación de Trayectoria 2D (LinuxCNC)
                </h2>
                <span className="text-[11px] font-mono text-stone-500">
                  {toolpath.loops.length} contornos • {toolpath.totalCutLength.toFixed(1)} {plasmaConfig.unit} de corte
                </span>
              </div>
              <ErrorBoundary fallbackTitle="Error al ejecutar la simulación de corte">
                <CanvasVisualizer
                  toolpath={toolpath}
                  unit={plasmaConfig.unit}
                  cutFeedRate={plasmaConfig.cutFeedRate}
                  onOpenSettings={() => setShowSettings(true)}
                  workpiece={workpiece}
                  onAutoFitToWorkpiece={handleAutoFitToWorkpiece}
                />
              </ErrorBoundary>
            </div>

            {/* G-Code NGC Viewer & Download */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Código G Saliente (.NGC)
              </h2>
              <GCodeViewer
                toolpath={toolpath}
                unit={plasmaConfig.unit}
                fileName={currentDownloadName}
                controllerMode={plasmaConfig.controllerMode}
                workpiece={workpiece}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="app-footer" className="bg-white border-t border-stone-200 py-4 px-4 text-xs text-stone-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PlasmaNGC Studio • Diseñado para mesas de corte CNC plasma y LinuxCNC (Axis / Gmoccapy)</span>
          <span className="font-mono text-stone-400">Salida: G-Code estándar RS274/NGC</span>
        </div>
      </footer>

      {/* Offline Status Alert */}
      <OfflineIndicator />
    </div>
  );
}


