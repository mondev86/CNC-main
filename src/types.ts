export type MeasurementUnit = 'mm' | 'inch';

export type FontStyleType = 'stencil' | 'single_line' | 'industrial_stencil';

export type ControllerMode = 'qtplasmac' | 'standard';

export interface PlasmaConfig {
  unit: MeasurementUnit;
  controllerMode: ControllerMode; // 'qtplasmac' (Modo 0 sin Z, gestionado por QtPlasmaC) or 'standard' (Z explícito)
  cutFeedRate: number;        // e.g. 1800 mm/min
  rapidFeedRate: number;      // e.g. 6000 mm/min
  safeZ: number;              // e.g. 25 mm
  pierceHeightZ: number;      // e.g. 3.8 mm
  cutHeightZ: number;         // e.g. 1.5 mm
  pierceDelay: number;        // seconds, e.g. 0.6s
  torchOnCommand: string;     // 'M3 S1' or 'M3'
  torchOffCommand: string;    // 'M5'
  enableTouchOff: boolean;    // LinuxCNC floating head / ohmic probe cycle
  probeFeedRate: number;      // e.g. 400 mm/min
  switchOffset: number;       // e.g. 1.2 mm
  leadInType: 'straight' | 'arc' | 'none';
  leadInLength: number;       // mm, e.g. 3.0
  leadInAngle: number;        // degrees, e.g. 45 or 90
  leadOutLength: number;      // mm, e.g. 1.5
  kerfWidth: number;          // mm, e.g. 1.2 mm
  g64Tolerance: number;       // LinuxCNC path blending, e.g. 0.1 mm
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Segment {
  type: 'rapid' | 'cut' | 'arc_cw' | 'arc_ccw' | 'lead_in' | 'lead_out';
  start: Point2D;
  end: Point2D;
  center?: Point2D; // for arcs
  radius?: number;
}

export interface ToolpathLoop {
  id: string;
  isClosed: boolean;
  piercePoint: Point2D;
  startPoint: Point2D;
  leadIn?: Segment;
  segments: Segment[];
  leadOut?: Segment;
  cutLength: number;
}

export interface ToolpathData {
  loops: ToolpathLoop[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  totalCutLength: number;
  totalRapidLength: number;
  pierceCount: number;
  estimatedTimeSeconds: number;
  gcode: string;
}

export interface TextOptions {
  text: string;
  fontType: FontStyleType;
  fontSize: number;          // mm
  letterSpacing: number;     // mm
  lineSpacing: number;       // multiplier, e.g. 1.3
  origin: 'bottom_left' | 'top_left' | 'center';
  bridgeWidth: number;       // stencil bridge width in mm
}

export interface WorkpieceConfig {
  enabled: boolean;
  width: number;             // mm (e.g. 600)
  height: number;            // mm (e.g. 400)
  margin: number;            // mm (e.g. 20)
  positionMode: 'origin_with_margin' | 'center' | 'absolute_zero' | 'manual_offset';
  rotationAngle: number;     // degrees (-180 to 180 or 0 to 360)
  rotationPivot: 'center' | 'origin';
  useG10Rotation?: boolean;  // whether to include G10 L2 P1 R... in G-code header
  offsetX?: number;          // manual X offset in mm
  offsetY?: number;          // manual Y offset in mm
  // Array / Multi-piece nesting
  arrayCols?: number;        // copies along X (default 1)
  arrayRows?: number;        // copies along Y (default 1)
  arrayGapX?: number;        // gap between parts along X in mm (default 10)
  arrayGapY?: number;        // gap between parts along Y in mm (default 10)
}

export interface SheetPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
  isPopular?: boolean;
}

export const STANDARD_SHEET_PRESETS: SheetPreset[] = [
  {
    id: '600x400',
    name: '600 × 400 mm',
    width: 600,
    height: 400,
    description: 'Estándar Simulación Debian QtPlasmaC / Mesa Banco',
    isPopular: true
  },
  {
    id: '500x300',
    name: '500 × 300 mm',
    width: 500,
    height: 300,
    description: 'Placa Cartelería / Letrero Taller',
    isPopular: true
  },
  {
    id: '800x500',
    name: '800 × 500 mm',
    width: 800,
    height: 500,
    description: 'Mesa CNC Compacta / Prototipado'
  },
  {
    id: '1000x500',
    name: '1000 × 500 mm',
    width: 1000,
    height: 500,
    description: 'Media Plancha Estándar Taller'
  },
  {
    id: '1000x1000',
    name: '1000 × 1000 mm',
    width: 1000,
    height: 1000,
    description: 'Mesa 1 m² LinuxCNC'
  },
  {
    id: '1200x800',
    name: '1200 × 800 mm',
    width: 1200,
    height: 800,
    description: 'Formato Europallet'
  },
  {
    id: '1250x2500',
    name: '1250 × 2500 mm',
    width: 1250,
    height: 2500,
    description: 'Chapa Industrial Estándar (4×8 pies)'
  }
];
