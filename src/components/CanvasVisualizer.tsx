import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolpathData, Point2D, WorkpieceConfig } from '../types';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2, Flame, Search, Repeat, Gauge, Sliders, AlertTriangle, Sparkles } from 'lucide-react';

interface CanvasVisualizerProps {
  toolpath: ToolpathData;
  unit: 'mm' | 'inch';
  cutFeedRate?: number;
  onOpenSettings?: () => void;
  workpiece?: WorkpieceConfig;
  onAutoFitToWorkpiece?: () => void; 
} 


export const CanvasVisualizer: React.FC<CanvasVisualizerProps> = ({
  toolpath,
  unit,
  cutFeedRate,
  onOpenSettings,
  workpiece,
  onAutoFitToWorkpiece,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transform
  const [scale, setScale] = useState<number>(2.5);
  const [offset, setOffset] = useState<Point2D>({ x: 60, y: 60 });
  const [baseFitScale, setBaseFitScale] = useState<number>(2.5);
  const [activeZoom, setActiveZoom] = useState<number>(1); // 1, 2, 5, 10 or 0 (custom)
  const [zoomFeedback, setZoomFeedback] = useState<string | null>(null);

  // Container dimensions observed via ResizeObserver
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 500,
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Point2D>({ x: 0, y: 0 });
  const [mouseCoord, setMouseCoord] = useState<Point2D>({ x: 0, y: 0 });

  // Simulation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [simSpeed, setSimSpeed] = useState<number>(2); // 1x, 2x, 5x
  const [isLooping, setIsLooping] = useState<boolean>(false); // Continuous auto-repeat loop

  // Ref to always have latest progress inside animation loop without stale closure or setter side effects
  const progressRef = useRef<number>(0);
  progressRef.current = progress;

  // Track container dimensions safely
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        setDimensions(prev => {
          if (prev.width === w && prev.height === h) return prev;
          return { width: w, height: h };
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update canvas backing buffer resolution ONLY when dimensions change (never on animation tick)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width <= 0 || dimensions.height <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(dimensions.width * dpr);
    canvas.height = Math.round(dimensions.height * dpr);
  }, [dimensions]);

  // Compute all linear segments in toolpath sequence for animation
  const flatAnimationSteps = React.useMemo(() => {
    const steps: {
      type: 'rapid' | 'cut' | 'lead_in' | 'lead_out' | 'pierce';
      start: Point2D;
      end: Point2D;
      loopIndex: number;
    }[] = [];

    let currentPos: Point2D = { x: 0, y: 0 };

    (toolpath?.loops || []).forEach((loop, lIdx) => {
      const pierce = loop.piercePoint || loop.startPoint || { x: 0, y: 0 };
      // 1. Rapid to pierce point
      steps.push({
        type: 'rapid',
        start: { ...currentPos },
        end: { ...pierce },
        loopIndex: lIdx,
      });
      currentPos = { ...pierce };

      // 2. Pierce dwell
      steps.push({
        type: 'pierce',
        start: { ...currentPos },
        end: { ...currentPos },
        loopIndex: lIdx,
      });

      // 3. Lead-in if exists
      if (loop.leadIn && loop.leadIn.start && loop.leadIn.end) {
        steps.push({
          type: 'lead_in',
          start: { ...loop.leadIn.start },
          end: { ...loop.leadIn.end },
          loopIndex: lIdx,
        });
        currentPos = { ...loop.leadIn.end };
      }

      // 4. Contour cuts
      (loop.segments || []).forEach(seg => {
        if (seg && seg.start && seg.end) {
          steps.push({
            type: 'cut',
            start: { ...seg.start },
            end: { ...seg.end },
            loopIndex: lIdx,
          });
          currentPos = { ...seg.end };
        }
      });

      // 5. Lead-out if exists
      if (loop.leadOut && loop.leadOut.start && loop.leadOut.end) {
        steps.push({
          type: 'lead_out',
          start: { ...loop.leadOut.start },
          end: { ...loop.leadOut.end },
          loopIndex: lIdx,
        });
        currentPos = { ...loop.leadOut.end };
      }
    });

    // Rapid return to origin
    steps.push({
      type: 'rapid',
      start: { ...currentPos },
      end: { x: 0, y: 0 },
      loopIndex: -1,
    });

    return steps;
  }, [toolpath]);

  // Zoom preset & fit-to-screen handler (1x, 2x, 5x, 10x)
  const handleZoomPreset = useCallback((multiplier: number) => {
    const wContainer = dimensions.width > 0 ? dimensions.width : 800;
    const hContainer = dimensions.height > 0 ? dimensions.height : 500;

    const bounds = toolpath?.bounds || { width: 100, height: 100, minX: 0, minY: 0 };
    
    // If workpiece is active, fit the union of the workpiece and the toolpath
    let minX = isFinite(bounds.minX) ? bounds.minX : 0;
    let minY = isFinite(bounds.minY) ? bounds.minY : 0;
    let maxX = isFinite(bounds.maxX) ? bounds.maxX : 100;
    let maxY = isFinite(bounds.maxY) ? bounds.maxY : 100;

    if (workpiece && workpiece.enabled) {
      minX = Math.min(minX, 0);
      minY = Math.min(minY, 0);
      maxX = Math.max(maxX, workpiece.width);
      maxY = Math.max(maxY, workpiece.height);
    }

    const w = Math.max(15, maxX - minX);
    const h = Math.max(15, maxY - minY);

    const padding = 70;
    const scaleX = Math.max(0.05, (wContainer - padding * 2) / w);
    const scaleY = Math.max(0.05, (hContainer - padding * 2) / h);
    const fitScale = Math.max(0.2, Math.min(Math.min(scaleX, scaleY, 8), 15));
    setBaseFitScale(fitScale);

    const targetScale = fitScale * multiplier;
    setScale(targetScale);

    // Center toolpath/workpiece geometry in viewport
    const centerX = minX + w / 2;
    const centerY = minY + h / 2;

    const newOffsetX = wContainer / 2 - centerX * targetScale;
    const newOffsetY = hContainer / 2 + centerY * targetScale;
    setOffset({ x: newOffsetX, y: newOffsetY });

    setActiveZoom(multiplier);
    setZoomFeedback(`Zoom ${multiplier}x (${Math.round(multiplier * 100)}%)`);
  }, [toolpath?.bounds, dimensions, workpiece]);

  const handleFitToScreen = useCallback(() => {
    handleZoomPreset(1);
  }, [handleZoomPreset]);

  // Clear zoom feedback message after 1.5s
  useEffect(() => {
    if (!zoomFeedback) return;
    const timer = setTimeout(() => setZoomFeedback(null), 1500);
    return () => clearTimeout(timer);
  }, [zoomFeedback]);

  const handleFitToScreenRef = useRef(handleFitToScreen);
  handleFitToScreenRef.current = handleFitToScreen;

  // Initial fit on toolpath change
  useEffect(() => {
    handleFitToScreenRef.current();
    progressRef.current = 0;
    setProgress(0);
    setIsPlaying(false);
  }, [toolpath]);

  // Robust animation frame loop
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min(Math.max(0, (time - lastTime) / 1000), 0.1);
      lastTime = time;

      // Full toolpath traverse duration scaled by simSpeed
      const increment = dt * 0.08 * simSpeed;
      const nextProgress = progressRef.current + increment;

      if (nextProgress >= 1) {
        if (isLooping) {
          progressRef.current = 0;
          setProgress(0);
          animId = requestAnimationFrame(animate);
          return;
        }
        progressRef.current = 1;
        setProgress(1);
        setIsPlaying(false);
        return; // Halt loop cleanly
      }

      progressRef.current = nextProgress;
      setProgress(nextProgress);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, simSpeed, isLooping]);

  // High-performance canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width <= 0 || dimensions.height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = dimensions;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    try {
      // 1. Clear & Dark CAD workspace background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, width, height);

      // Safe coordinate projection
      const safeScale = Math.max(0.1, isFinite(scale) ? scale : 1);
      const safeOffsetX = isFinite(offset.x) ? offset.x : width / 2;
      const safeOffsetY = isFinite(offset.y) ? offset.y : height / 2;

      const toScreenX = (wx: number) => safeOffsetX + (isFinite(wx) ? wx : 0) * safeScale;
      const toScreenY = (wy: number) => safeOffsetY - (isFinite(wy) ? wy : 0) * safeScale;

      // 2. Grid lines with range validation to prevent infinite loops
      const gridSpacing = unit === 'inch' ? 1 : 10; // 10mm or 1 in
      const majorGridSpacing = gridSpacing * 5;

      const worldLeft = (0 - safeOffsetX) / safeScale;
      const worldRight = (width - safeOffsetX) / safeScale;
      const worldBottom = (safeOffsetY - height) / safeScale;
      const worldTop = safeOffsetY / safeScale;

      if (isFinite(worldLeft) && isFinite(worldRight) && isFinite(worldBottom) && isFinite(worldTop)) {
        const startGridX = Math.floor(worldLeft / gridSpacing) * gridSpacing;
        const endGridX = Math.ceil(worldRight / gridSpacing) * gridSpacing;
        const startGridY = Math.floor(worldBottom / gridSpacing) * gridSpacing;
        const endGridY = Math.ceil(worldTop / gridSpacing) * gridSpacing;

        const countX = Math.round((endGridX - startGridX) / gridSpacing);
        const countY = Math.round((endGridY - startGridY) / gridSpacing);

        // Minor grid (only draw if reasonable density)
        if (countX > 0 && countX < 400 && countY > 0 && countY < 400) {
          ctx.strokeStyle = '#1e293b'; // slate-800
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = startGridX; x <= endGridX; x += gridSpacing) {
            const sx = toScreenX(x);
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
          }
          for (let y = startGridY; y <= endGridY; y += gridSpacing) {
            const sy = toScreenY(y);
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
          }
          ctx.stroke();

          // Major grid
          const startMajorX = Math.floor(worldLeft / majorGridSpacing) * majorGridSpacing;
          const endMajorX = Math.ceil(worldRight / majorGridSpacing) * majorGridSpacing;
          const startMajorY = Math.floor(worldBottom / majorGridSpacing) * majorGridSpacing;
          const endMajorY = Math.ceil(worldTop / majorGridSpacing) * majorGridSpacing;

          ctx.strokeStyle = '#334155'; // slate-700
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = startMajorX; x <= endMajorX; x += majorGridSpacing) {
            const sx = toScreenX(x);
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
          }
          for (let y = startMajorY; y <= endMajorY; y += majorGridSpacing) {
            const sy = toScreenY(y);
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
          }
          ctx.stroke();
        }
      }

      // 2.5 Draw Workpiece / Pizarra Sheet (Physical plate)
      if (workpiece && workpiece.enabled && workpiece.width > 0 && workpiece.height > 0) {
        const sX0 = toScreenX(0);
        const sYTop = toScreenY(workpiece.height);
        const sW = workpiece.width * safeScale;
        const sH = workpiece.height * safeScale;

        // Check if cut bounds exceed the sheet
        const exceeds = Boolean(toolpath?.bounds && (
          toolpath.bounds.maxX > workpiece.width ||
          toolpath.bounds.maxY > workpiece.height ||
          toolpath.bounds.minX < 0 ||
          toolpath.bounds.minY < 0
        ));

        // Background of the metal plate / pizarra
        ctx.fillStyle = exceeds ? 'rgba(69, 10, 10, 0.45)' : 'rgba(30, 41, 59, 0.55)';
        ctx.fillRect(sX0, sYTop, sW, sH);

        // Plate border
        ctx.strokeStyle = exceeds ? '#ef4444' : '#64748b';
        ctx.lineWidth = exceeds ? 2 : 1.5;
        ctx.strokeRect(sX0, sYTop, sW, sH);

        // Safety margin boundary (dashed inside)
        if (workpiece.margin > 0 && workpiece.width > workpiece.margin * 2 && workpiece.height > workpiece.margin * 2) {
          const mX0 = toScreenX(workpiece.margin);
          const mYTop = toScreenY(workpiece.height - workpiece.margin);
          const mW = (workpiece.width - workpiece.margin * 2) * safeScale;
          const mH = (workpiece.height - workpiece.margin * 2) * safeScale;

          ctx.strokeStyle = exceeds ? 'rgba(239, 68, 68, 0.6)' : 'rgba(249, 115, 22, 0.45)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1;
          ctx.strokeRect(mX0, mYTop, mW, mH);
          ctx.setLineDash([]);
        }

        // Corner tick marks on sheet
        const tick = Math.max(6, Math.min(16, 12 * safeScale));
        ctx.strokeStyle = exceeds ? '#ef4444' : '#94a3b8';
        ctx.lineWidth = 1.5;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(sX0, sYTop + tick); ctx.lineTo(sX0, sYTop); ctx.lineTo(sX0 + tick, sYTop);
        // Top-right
        ctx.moveTo(sX0 + sW - tick, sYTop); ctx.lineTo(sX0 + sW, sYTop); ctx.lineTo(sX0 + sW, sYTop + tick);
        // Bottom-left
        ctx.moveTo(sX0, sYTop + sH - tick); ctx.lineTo(sX0, sYTop + sH); ctx.lineTo(sX0 + tick, sYTop + sH);
        // Bottom-right
        ctx.moveTo(sX0 + sW - tick, sYTop + sH); ctx.lineTo(sX0 + sW, sYTop + sH); ctx.lineTo(sX0 + sW, sYTop + sH - tick);
        ctx.stroke();

        // Label on plate
        ctx.fillStyle = exceeds ? '#fca5a5' : '#94a3b8';
        ctx.font = '10px monospace';
        const angText = workpiece.rotationAngle ? ` | Ángulo: ${workpiece.rotationAngle}°` : '';
        ctx.fillText(`PIZARRA: ${workpiece.width} × ${workpiece.height} mm (Margen ${workpiece.margin} mm${angText})`, sX0 + 8, sYTop + 14);
      }

      // 3. Origin axes (0,0)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toScreenX(0), toScreenY(0));
      ctx.lineTo(toScreenX(40), toScreenY(0));
      ctx.stroke();

      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(toScreenX(0), toScreenY(0));
      ctx.lineTo(toScreenX(0), toScreenY(40));
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(toScreenX(0), toScreenY(0), 4, 0, Math.PI * 2);
      ctx.fill();

      // Axis label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText('X (0,0)', toScreenX(6), toScreenY(-8));

      // 4. Draw Toolpath Bounding Box
      if (toolpath?.bounds && isFinite(toolpath.bounds.width) && toolpath.bounds.width > 0) {
        ctx.strokeStyle = '#475569';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        const bMinX = toScreenX(toolpath.bounds.minX);
        const bMaxY = toScreenY(toolpath.bounds.maxY);
        const bWidth = toolpath.bounds.width * safeScale;
        const bHeight = toolpath.bounds.height * safeScale;
        ctx.strokeRect(bMinX, bMaxY, bWidth, bHeight);
        ctx.setLineDash([]);
      }

      // 5. Draw Rapid moves (Cyan dashed)
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let rapidPt: Point2D = { x: 0, y: 0 };
      (toolpath?.loops || []).forEach(loop => {
        const pierce = loop.piercePoint || loop.startPoint || { x: 0, y: 0 };
        ctx.moveTo(toScreenX(rapidPt.x), toScreenY(rapidPt.y));
        ctx.lineTo(toScreenX(pierce.x), toScreenY(pierce.y));
        rapidPt = loop.leadOut ? loop.leadOut.end : loop.startPoint;
      });
      ctx.moveTo(toScreenX(rapidPt.x), toScreenY(rapidPt.y));
      ctx.lineTo(toScreenX(0), toScreenY(0));
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Draw Contours and Cuts
      const totalSteps = flatAnimationSteps.length;
      const currentStepIdx = totalSteps > 0
        ? Math.max(0, Math.min(totalSteps - 1, Math.floor(progress * totalSteps)))
        : 0;

      const isSimulating = isPlaying || progress > 0;

      (toolpath?.loops || []).forEach(loop => {
        // Lead-in (Magenta)
        if (loop.leadIn) {
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(toScreenX(loop.leadIn.start.x), toScreenY(loop.leadIn.start.y));
          ctx.lineTo(toScreenX(loop.leadIn.end.x), toScreenY(loop.leadIn.end.y));
          ctx.stroke();
        }

        // Contour segments
        ctx.strokeStyle = isSimulating ? '#475569' : '#f97316'; // Muted when simulating so the cut trail pops
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        (loop.segments || []).forEach((seg, sIdx) => {
          if (sIdx === 0) {
            ctx.moveTo(toScreenX(seg.start.x), toScreenY(seg.start.y));
          }
          ctx.lineTo(toScreenX(seg.end.x), toScreenY(seg.end.y));
        });
        ctx.stroke();

        // Lead-out (Magenta)
        if (loop.leadOut) {
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(toScreenX(loop.leadOut.start.x), toScreenY(loop.leadOut.start.y));
          ctx.lineTo(toScreenX(loop.leadOut.end.x), toScreenY(loop.leadOut.end.y));
          ctx.stroke();
        }

        // Pierce Points
        const px = toScreenX(loop.piercePoint.x);
        const py = toScreenY(loop.piercePoint.y);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 6.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 7. Dynamic cut trail in simulation (Vibrant flame orange)
      if (isSimulating && totalSteps > 0) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.beginPath();

        for (let i = 0; i <= currentStepIdx; i++) {
          const step = flatAnimationSteps[i];
          if (step && (step.type === 'cut' || step.type === 'lead_in' || step.type === 'lead_out')) {
            ctx.moveTo(toScreenX(step.start.x), toScreenY(step.start.y));
            if (i === currentStepIdx) {
              const fraction = Math.max(0, Math.min(1, (progress * totalSteps) - currentStepIdx));
              const curX = step.start.x + (step.end.x - step.start.x) * fraction;
              const curY = step.start.y + (step.end.y - step.start.y) * fraction;
              ctx.lineTo(toScreenX(curX), toScreenY(curY));
            } else {
              ctx.lineTo(toScreenX(step.end.x), toScreenY(step.end.y));
            }
          }
        }
        ctx.stroke();
      }

      // 8. Animated Simulation Torch Head
      if (totalSteps > 0) {
        const stepFraction = Math.max(0, Math.min(1, (progress * totalSteps) - currentStepIdx));
        const activeStep = flatAnimationSteps[currentStepIdx];

        if (activeStep && activeStep.start && activeStep.end) {
          const torchX = activeStep.start.x + (activeStep.end.x - activeStep.start.x) * stepFraction;
          const torchY = activeStep.start.y + (activeStep.end.y - activeStep.start.y) * stepFraction;

          const tScrX = toScreenX(torchX);
          const tScrY = toScreenY(torchY);

          if (isFinite(tScrX) && isFinite(tScrY)) {
            // Plasma arc glow when torch is active
            if (activeStep.type !== 'rapid') {
              try {
                const grad = ctx.createRadialGradient(tScrX, tScrY, 2, tScrX, tScrY, 24);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.25, '#38bdf8');
                grad.addColorStop(0.65, 'rgba(249, 115, 22, 0.7)');
                grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(tScrX, tScrY, 24, 0, Math.PI * 2);
                ctx.fill();
              } catch (gradErr) {
                // Gracefully ignore gradient issues
              }

              // Pierce spark effect
              if (activeStep.type === 'pierce') {
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(tScrX, tScrY, 8, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Cutting Head Nozzle ring & center
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(tScrX, tScrY, 4.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = activeStep.type === 'rapid' ? '#38bdf8' : '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(tScrX, tScrY, 10, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshair
            ctx.strokeStyle = activeStep.type === 'rapid' ? '#38bdf8' : '#fb923c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tScrX - 14, tScrY);
            ctx.lineTo(tScrX + 14, tScrY);
            ctx.moveTo(tScrX, tScrY - 14);
            ctx.lineTo(tScrX, tScrY + 14);
            ctx.stroke();
          }
        }
      }
    } catch (renderError) {
      console.error('Error in CanvasVisualizer frame:', renderError);
    } finally {
      ctx.restore();
    }
  }, [toolpath, scale, offset, progress, flatAnimationSteps, unit, dimensions, isPlaying, workpiece]);

  // Mouse pan & zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const safeScale = Math.max(0.1, isFinite(scale) ? scale : 1);
    const wx = (mx - offset.x) / safeScale;
    const wy = (offset.y - my) / safeScale;
    setMouseCoord({ x: wx, y: wy });

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.max(0.2, Math.min(scale * zoomFactor, 40));

    const newOffsetX = mx - (mx - offset.x) * (newScale / scale);
    const newOffsetY = my - (my - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
    setActiveZoom(0);
  };

  return (
    <div
      id="canvas-visualizer-container"
      ref={containerRef}
      className="relative w-full h-[520px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col select-none shadow-inner"
    >
      {/* 2D HTML5 Canvas */}
      <canvas
        id="cnc-plasma-canvas"
        ref={canvasRef}
        className="w-full flex-1 cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Big Center Play Prompt when simulation is at 0% and stopped */}
      {!isPlaying && progress === 0 && (
        <div
          id="canvas-center-play-overlay"
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 backdrop-blur-md shadow-2xl">
            <button
              id="btn-overlay-play"
              type="button"
              onClick={() => {
                progressRef.current = 0;
                setProgress(0);
                setIsPlaying(true);
              }}
              className="pointer-events-auto flex items-center gap-2.5 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-2xl border border-emerald-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <Play className="w-5 h-5 fill-current text-white group-hover:scale-110 transition-transform" />
              <span>Ver Simulación Automática (Play)</span>
            </button>

            {/* Quick Speed Selection before starting */}
            <div className="pointer-events-auto flex items-center gap-1.5 text-xs text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Velocidad simulación:</span>
              <div className="flex items-center border border-slate-700/60 rounded-md overflow-hidden bg-slate-900">
                {[
                  { val: 0.25, label: '0.25x' },
                  { val: 0.5, label: '0.5x' },
                  { val: 1, label: '1x' },
                  { val: 2, label: '2x' },
                  { val: 5, label: '5x' },
                ].map(sp => (
                  <button
                    key={sp.val}
                    type="button"
                    onClick={() => setSimSpeed(sp.val)}
                    className={`px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      simSpeed === sp.val ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Zoom Feedback Toast Notification */}
      {zoomFeedback && (
        <div
          id="zoom-feedback-toast"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-950/95 text-amber-400 font-mono text-xs px-3.5 py-1.5 rounded-full border border-amber-500/50 shadow-2xl flex items-center gap-1.5 backdrop-blur-md"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="font-semibold">{zoomFeedback}</span>
        </div>
      )}

      {/* Exceeds Workpiece Warning Banner */}
      {workpiece?.enabled && (
        (() => {
          const b = toolpath?.bounds;
          const exceeds = Boolean(b && (b.maxX > workpiece.width || b.maxY > workpiece.height || b.minX < 0 || b.minY < 0));
          if (!exceeds) return null;
          return (
            <div
              id="exceeds-pizarra-banner"
              className="absolute top-14 left-3 z-20 flex items-center gap-2.5 bg-red-950/90 border border-red-500/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs text-red-200 shadow-2xl pointer-events-auto"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-semibold text-red-200">No alcanza en la pizarra ({workpiece.width} × {workpiece.height} mm)</span>
                <span className="text-[11px] text-red-300 ml-1.5 hidden sm:inline">El corte sobrepasa el área física de la chapa.</span>
              </div>
              {onAutoFitToWorkpiece && (
                <button
                  type="button"
                  onClick={onAutoFitToWorkpiece}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer ml-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ajustar para que quepa</span>
                </button>
              )}
            </div>
          );
        })()
      )}

      {/* Top HUD Overlay: Coordinate readout & Legend */}
      <div
        id="canvas-top-hud"
        className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none"
      >
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs font-mono text-slate-300 shadow-md pointer-events-auto">
          <span className="text-amber-400 font-semibold">X: {mouseCoord.x.toFixed(2)} {unit}</span>
          <span className="text-emerald-400 font-semibold">Y: {mouseCoord.y.toFixed(2)} {unit}</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-semibold">
            Zoom: {activeZoom ? `${activeZoom}x` : `${(scale / (baseFitScale || 1)).toFixed(1)}x`}
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300" title="Velocidad de reproducción de la simulación">
            <Gauge className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300 font-semibold">{simSpeed}x</span>
          </span>
          {workpiece?.rotationAngle !== undefined && workpiece.rotationAngle !== 0 && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-orange-400 font-semibold flex items-center gap-0.5" title="Ángulo de inclinación / rotación">
                <span>∠</span>
                <span>{workpiece.rotationAngle}°</span>
              </span>
            </>
          )}
          {workpiece?.arrayCols && workpiece?.arrayRows && (workpiece.arrayCols > 1 || workpiece.arrayRows > 1) && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-semibold" title="Matriz de piezas">
                {workpiece.arrayCols * workpiece.arrayRows} piezas ({workpiece.arrayCols}×{workpiece.arrayRows})
              </span>
            </>
          )}
          {cutFeedRate !== undefined && (
            <>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="Velocidad de corte de la máquina (F) en el código G. Haz clic para cambiar en Parámetros de Plasma"
              >
                <span>F: {cutFeedRate} {unit}/min</span>
                {onOpenSettings && <Sliders className="w-3 h-3 text-slate-400" />}
              </button>
            </>
          )}
          {isPlaying && (
            <>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Simulación en vivo</span>
              </span>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-300 shadow-md pointer-events-auto">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
            <span>Corte</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm" />
            <span>G0 Rápido</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm" />
            <span>Entrada/Salida</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
            <span>Perforación</span>
          </div>
        </div>
      </div>

      {/* Viewport Zoom & Pan Floating Controls */}
      <div
        id="viewport-controls"
        className="absolute right-3 top-16 z-10 flex flex-col items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/50 shadow-lg"
      >
        <button
          id="btn-zoom-in"
          type="button"
          onClick={() => {
            setScale(s => Math.min(s * 1.25, 40));
            setActiveZoom(0);
            setZoomFeedback('Acercar (+)');
          }}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          type="button"
          onClick={() => {
            setScale(s => Math.max(s * 0.8, 0.2));
            setActiveZoom(0);
            setZoomFeedback('Alejar (-)');
          }}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-fit-screen"
          type="button"
          onClick={handleFitToScreen}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
          title="Ajustar a pantalla (1x)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-full h-px bg-slate-800 my-0.5" />

        {/* Quick Zoom Presets 1x, 2x, 5x, 10x */}
        {[1, 2, 5, 10].map(z => (
          <button
            key={z}
            id={`viewport-zoom-${z}x`}
            type="button"
            onClick={() => handleZoomPreset(z)}
            className={`w-7 py-1 text-[11px] font-mono rounded transition-all text-center cursor-pointer ${
              activeZoom === z
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={`Zoom ${z}x`}
          >
            {z}x
          </button>
        ))}
      </div>

      {/* Bottom HUD: CNC Simulation Playback Toolbar */}
      <div
        id="simulation-toolbar"
        className="relative z-10 p-2.5 bg-slate-950/85 backdrop-blur-md border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        {/* Left: Simulation playback & speed */}
        <div className="flex items-center gap-2">
          <button
            id="btn-play-pause-simulation"
            type="button"
            onClick={() => {
              if (progress >= 1) {
                progressRef.current = 0;
                setProgress(0);
              }
              setIsPlaying(prev => !prev);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-400/30'
            }`}
            title={isPlaying ? 'Pausar simulación automática' : 'Reproducir simulación en automático (Play)'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{progress >= 1 ? 'Repetir Play' : 'Play Simulación'}</span>
              </>
            )}
          </button>

          <button
            id="btn-reset-simulation"
            type="button"
            onClick={() => {
              setIsPlaying(false);
              progressRef.current = 0;
              setProgress(0);
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 rounded-lg transition-colors border border-slate-700/50 cursor-pointer"
            title="Rebobinar al inicio (0%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Continuous Loop Toggle */}
          <button
            id="btn-loop-simulation"
            type="button"
            onClick={() => setIsLooping(l => !l)}
            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
              isLooping
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/60 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700/50'
            }`}
            title={isLooping ? 'Bucle automático activado (Repetir siempre)' : 'Activar bucle automático (Repetir)'}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Simulation Speed Selector */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
            <div className="flex items-center gap-1 text-slate-400 text-[11px]" title="Velocidad de reproducción de la simulación">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline font-medium">Velocidad:</span>
            </div>
            <div className="flex items-center border border-slate-700/60 rounded-lg overflow-hidden bg-slate-950 shadow-inner">
              {[
                { val: 0.25, label: '0.25x', title: 'Muy lenta (0.25x) - Cámara lenta para ver perforación y entradas' },
                { val: 0.5, label: '0.5x', title: 'Lenta (0.5x) - Media velocidad' },
                { val: 1, label: '1x', title: 'Normal (1x) - Velocidad base' },
                { val: 2, label: '2x', title: 'Rápida (2x) - Doble velocidad' },
                { val: 5, label: '5x', title: 'Muy rápida (5x) - Avance acelerado' },
              ].map(opt => (
                <button
                  key={opt.val}
                  id={`speed-btn-${opt.val}x`}
                  type="button"
                  onClick={() => setSimSpeed(opt.val)}
                  className={`px-2 py-1 text-xs transition-colors cursor-pointer font-medium ${
                    simSpeed === opt.val
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={opt.title}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Timeline Scrubber */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[160px] max-w-xs">
          <Flame className={`w-4 h-4 shrink-0 ${isPlaying ? 'text-orange-500 animate-pulse' : 'text-slate-500'}`} />
          <input
            id="simulation-timeline-slider"
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={progress}
            onChange={e => {
              const val = parseFloat(e.target.value);
              progressRef.current = val;
              setProgress(val);
              if (isPlaying) setIsPlaying(false);
            }}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <span className="font-mono text-slate-400 text-xs w-9 text-right shrink-0">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Right: Interactive Zoom Presets (1x, 2x, 5x, 10x) */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 rounded-lg p-1 shadow-sm">
          <div className="flex items-center gap-1 text-slate-300 pl-1 pr-0.5">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 font-semibold text-xs">Zoom:</span>
          </div>
          <div className="flex items-center border border-slate-700/50 rounded-md overflow-hidden bg-slate-950">
            {[1, 2, 5, 10].map(z => (
              <button
                key={z}
                id={`zoom-btn-${z}x`}
                type="button"
                onClick={() => handleZoomPreset(z)}
                className={`px-2.5 py-1 text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeZoom === z
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={`Zoom a ${z}x (${z * 100}%)`}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
