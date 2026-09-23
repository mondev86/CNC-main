# PlasmaNGC Studio - Generador LinuxCNC G-Code (.ngc)

Aplicación para generar trayectorias y código G estándar para máquinas de corte por plasma controladas con **LinuxCNC** (QtPlasmaC / Axis) a partir de texto stencil/plasma o vectores SVG.

---

## 🌟 Método Recomendado de Instalación: Directo desde el Navegador (1 Clic)

Esta es la forma más rápida, segura y limpia de tener la aplicación instalada en tu ordenador con Windows 11 o Linux, sin problemas de permisos ni pantallas de bloqueo de SmartScreen:

### En Google Chrome (Windows 11):
1. Abre la aplicación en tu navegador Chrome (en una pestaña independiente).
2. Haz clic en el menú de los **tres puntos `⋮`** arriba a la derecha.
3. Dependiendo del idioma y versión de tu navegador:
   - **En inglés:** Selecciona **`Save page as app`** (o bien `Save and share` ➔ `Create shortcut...` con la casilla **☑ "Open as window"** marcada).
   - **En español:** Selecciona **`Guardar y compartir`** ➔ **`Instalar página como aplicación...`** (o `Crear acceso directo...` con casilla *Abrir como ventana*).
4. Pulsa **Instalar / Crear**.

> **¡Listo!** Chrome crea un acceso directo oficial en tu Escritorio de Windows 11. Se abrirá en su propia ventana independiente (sin barras de navegador) y funcionará **100% sin conexión a internet (Offline)** en el taller.

### En Microsoft Edge (Windows 11):
1. Abre la aplicación en Edge.
2. En la barra de direcciones (donde escribes la URL), haz clic en el icono del monitor con una flecha **`[+]`** (*"Instalar PlasmaNGC Studio"*).
3. Pulsa **Instalar**.
4. Marca la casilla *"Crear acceso directo en el escritorio"* y *"Anclar a la barra de tareas"*.

---

## 💻 Método Alternativo: Carpeta Local con Código Fuente y Scripts

Si prefieres ejecutar el código fuente directamente en tu máquina local:

### En Windows 11 / 10:
1. Haz doble clic en **`INSTALAR_WINDOWS_11.cmd`** o **`INICIAR_APP.cmd`**.
   - Estos archivos incluyen desbloqueo automático para evitar la pantalla azul de Windows Defender SmartScreen.
2. La primera vez instalará automáticamente los paquetes locales y abrirá la aplicación en tu navegador.
3. *Requisito:* Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

### En Linux (Debian / Ubuntu / LinuxCNC / Mint):
1. Abre una terminal en la carpeta del proyecto.
2. Dale permisos de ejecución al script:
   ```bash
   chmod +x ejecutar_linux.sh
   ```
3. Ejecútalo:
   ```bash
   ./ejecutar_linux.sh
   ```
4. Se iniciará el servidor local y abrirá la aplicación.

---

## ⚙️ Características principales
- **Fuentes Stencil para Plasma**: Letras con puentes físicos de soporte para evitar que se caigan las islas interiores (A, B, D, O, P, Q, R).
- **Conversor de Vectores SVG**: Inversión automática del eje Y (el estándar SVG tiene el origen arriba a la izquierda; el código CNC sitúa el origen abajo a la izquierda).
- **Alineación y Simulación en Chapa**: Colocación en la chapa con márgenes de seguridad, rotación en cualquier ángulo y replicación matricial (anidado simple en filas y columnas).
- **Salida Específica para LinuxCNC / QtPlasmaC**:
  - Encendido/apagado de antorcha con husillo 0 (`M3 $0 S1` y `M5 $0`).
  - Compatibilidad nativa con control de altura THC y palpador de chapa óhmico/flotante IHS.
  - Generación de entradas (*Lead-in*) y salidas (*Lead-out*) para evitar muescas en el contorno final.
