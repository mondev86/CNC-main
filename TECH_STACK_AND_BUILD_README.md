# PlasmaNGC Studio - Memoria Técnica de Construcción y Stack Tecnológico
> **Documento de Arquitectura, Decisiones Técnicas y Proceso de Ingeniería**

Este documento detalla todas las tecnologías, librerías, algoritmos y decisiones arquitectónicas utilizadas para construir **PlasmaNGC Studio** desde la fase inicial hasta la implementación final del sistema de instalación nativa PWA (Progressive Web App) en Windows 11 y Linux.

---

## 1. Stack Tecnológico Base y Ecosistema

- **Entorno de Ejecución y Lenguaje**: TypeScript (Strict Mode) sobre Node.js 18+.
- **Framework de Interfaz de Usuario**: React 19 (Componentes funcionales, Hooks personalizados, renderizado optimizado con memoización).
- **Bundler y Herramientas de Compilación**: Vite 6 con soporte de ESM nativo y tree-shaking agresivo para arranque instantáneo.
- **Motor de Estilos**: Tailwind CSS 4 con `@import "tailwindcss";`, configurado sin dependencias de fuentes externas o CDN para garantizar autonomía 100% offline.
- **Iconografía**: `lucide-react` para componentes de control industrial, visores y diálogos de instalación.

---

## 2. Motores Centrales de Cálculo y Geometría CNC

### A. Motor de Tipografía Stencil / Plasma (`src/utils/plasmaFonts.ts`)
- **Problema en corte por plasma**: Las fuentes tipográficas estándar tienen "islas" cerradas (letras como A, B, D, O, P, Q, R, 0, 4, 6, 8, 9). Si se cortan completas, el material del centro se desprende de la chapa y se cae.
- **Solución implementada**:
  - Modelado de fuentes vectoriales diseñadas exclusivamente con **puentes físicos de soporte** (*bridges*).
  - Algoritmo de discretización de caracteres en trazados polilineales `Path2D` y vectores SVG normalizados.
  - Cálculo de espaciado proporcional entre caracteres (*kerning* y separación fija para evitar sobrecalentamiento térmico del puente).

### B. Motor de Ingesta y Vectorización SVG (`src/utils/svgParser.ts`)
- **Problema de origen de coordenadas**: El sistema de coordenadas estándar del formato SVG sitúa el origen `(0, 0)` en la esquina **superior izquierda**, creciendo hacia abajo (`+Y`). En las máquinas CNC y en LinuxCNC/G-Code, el origen `(0, 0)` está en la esquina **inferior izquierda**, creciendo hacia arriba (`+Y`).
- **Solución implementada**:
  - Parser SVG en el cliente que recorre elementos `<path>`, `<rect>`, `<circle>`, `<polygon>`, `<polyline>`.
  - Inversión matemática del eje Y con respecto al Bounding Box (`Y_cnc = TotalHeight - Y_svg`).
  - Conversión de curvas Bézier cúbicas y cuadráticas en segmentos de aproximación lineal y arcos circulares para corte suave en LinuxCNC.

### C. Generador de Código G (.ngc) para LinuxCNC (`src/utils/gcodeGenerator.ts`)
- **Dialecto CNC**: Estándar **RS274NGC** adaptado específicamente para cinemática de corte por plasma con **QtPlasmaC / Axis**.
- **Control de Antorcha**:
  - Activación mediante husillo 0: `M3 $0 S1` (disparo de arco de plasma tras retardo de perforación).
  - Desactivación limpia: `M5 $0`.
- **Compensación de Sangría (*Kerf*)**: Ajuste del diámetro de la boquilla de plasma.
- **Control de Entradas y Salidas (*Lead-in / Lead-out*)**:
  - Creación de vectores tangenciales o lineales antes de tocar el contorno final para que el punto de perforación (*pierce pit*) no dañe la pieza terminada.
- **Secuencia de Palpado IHS y Control de Altura THC**:
  - Código compatible con sensado óhmico/flotante antes de cada perforación y activación de lecturas de tensión de arco para altura constante durante el avance.

### D. Simulador Gráfico y Disposición en Chapa (`src/components/WorkpieceVisualizer.tsx`)
- Renderizado interactivo sobre `<canvas>` con soporte para:
  - Definición de dimensiones reales de la chapa (ancho x alto en mm).
  - Márgenes de seguridad perimetrales.
  - Multiplicación matricial (anidado simple en filas y columnas con espacio entre piezas).
  - Rotación libre (0°, 90°, 180°, 270° o ángulo personalizado).
  - Visualización diferenciada: líneas de corte activas (rojo/naranja), desplazamientos en rápido G0 (líneas discontinuas cian) y puntos de perforación (cruces amarillas).

---

## 3. Evolución del Sistema de Distribución e Instalación

### Fase 1: Scripts Batch y Shell Locales (`.bat`, `.sh`, `.cmd`)
1. Se construyeron scripts para permitir la ejecución local:
   - `EJECUTAR_WINDOWS.bat` / `INICIAR_APP.cmd`.
   - `ejecutar_linux.sh` (con permisos de ejecución `chmod +x`).
2. **El problema en Windows 11**:
   - En actualizaciones recientes de Windows 11, Microsoft aplica el filtro **SmartScreen** con banderas `Zone.Identifier` a cualquier archivo descargado de internet.
   - La pantalla azul de advertencia (*"Windows protegió su PC"*) en muchos casos **oculta por completo** el botón de "Más información" o "Ejecutar de todas formas", generando rechazo y frustración al usuario final.
   - Requería además que el usuario tuviera instalado el runtime de Node.js en su máquina.

### Fase 2: Implementación de Progressive Web App (PWA) de Escritorio
Para solucionar de raíz los problemas de permisos de Windows 11, se transformó la aplicación en una **PWA certificada de 1-Clic**:

1. **Librería y Plugin Integrado**:
   - `vite-plugin-pwa`: Integrado en `vite.config.ts` con estrategia `registerType: 'autoUpdate'`.
2. **Generación del Web App Manifest**:
   - Identificador `id: '/'`, `display: 'standalone'`, iconos en alta resolución (`192x192` y `512x512` con soporte para máscara `maskable`).
   - Nombre de aplicación: `PlasmaNGC Studio`.
3. **Caché Offline con Workbox**:
   - Estrategia de pre-caché para todos los assets (`.js`, `.css`, `.html`, `.svg`, `.png`, fuentes).
   - Una vez instalada, la app corre **100% sin conexión a internet** dentro del taller.
4. **Registro del Service Worker (`src/main.tsx`)**:
   ```typescript
   import { registerSW } from 'virtual:pwa-register';

   registerSW({
     immediate: true,
     onNeedRefresh() {},
     onOfflineReady() {}
   });
   ```
5. **Captura del Evento Nativo de Instalación (`src/hooks/usePWAInstall.ts`)**:
   - Hook reactivo que intercepta el evento de navegador `beforeinstallprompt` y gestiona el flujo de `userChoice`.
   - Detección del modo `standalone` mediante `window.matchMedia('(display-mode: standalone)').matches`.

### Fase 3: Superación de la Restricción de iframes y Menú de Chrome
- **Desafío detectado**: Al probar en entornos de vista previa incrustados (iframes), navegadores como Google Chrome y Edge ocultan intencionadamente los avisos de instalación por política de sandbox.
- **Solución implementada**:
  - Detección de iframe en `DesktopInstallModal.tsx`.
  - Botón directo para lanzar la aplicación a pestaña completa.
  - Documentación de las acciones nativas en Chrome:
    - En inglés: **`Save page as app`** o `Create shortcut...` con **☑ "Open as window"**.
    - En español: **`Guardar y compartir`** ➔ **`Instalar página como aplicación...`**.
    - En Edge: Icono de instalación directa **`[+]`** en la barra de URL.

---

## 4. Resultado Final
El operador de máquina o taller ya no tiene que:
- Escribir comandos en la terminal.
- Instalar Node.js o paquetes adicionales en Windows 11.
- Desbloquear scripts bloqueados por políticas de seguridad de Windows Defender.

Simplemente pulsa **"Save page as app"** en el navegador y obtiene un **icono nativo en su Escritorio de Windows 11**, abriéndose en una ventana limpia e independiente y operando sin internet junto al control numérico LinuxCNC.
