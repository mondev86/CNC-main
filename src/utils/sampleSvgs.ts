export interface SampleSvgItem {
  id: string;
  name: string;
  category: string;
  svg: string;
}

export const SAMPLE_SVGS: SampleSvgItem[] = [
  {
    id: 'plasma-bracket',
    name: 'Soporte Escuadra con Ranuras',
    category: 'Mecánica',
    svg: `<svg viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Perfil exterior con chaflán -->
  <path d="M 10 10 L 140 10 L 140 70 L 110 90 L 10 90 Z" fill="none" stroke="black" stroke-width="2"/>
  <!-- Agujero circular pasante 1 -->
  <circle cx="35" cy="35" r="10" fill="none" stroke="black" stroke-width="2"/>
  <!-- Agujero circular pasante 2 -->
  <circle cx="115" cy="35" r="10" fill="none" stroke="black" stroke-width="2"/>
  <!-- Ranura central de ventilación/sujeción -->
  <rect x="55" y="55" width="40" height="18" rx="5" fill="none" stroke="black" stroke-width="2"/>
</svg>`
  },
  {
    id: 'pipe-flange',
    name: 'Brida Circular 4 Taladros',
    category: 'Calderería',
    svg: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
  <!-- Diámetro exterior brida -->
  <circle cx="80" cy="80" r="70" fill="none" stroke="black" stroke-width="2"/>
  <!-- Diámetro interior tubo -->
  <circle cx="80" cy="80" r="35" fill="none" stroke="black" stroke-width="2"/>
  <!-- 4 Taladros de perno PCD -->
  <circle cx="80" cy="28" r="8" fill="none" stroke="black" stroke-width="2"/>
  <circle cx="132" cy="80" r="8" fill="none" stroke="black" stroke-width="2"/>
  <circle cx="80" cy="132" r="8" fill="none" stroke="black" stroke-width="2"/>
  <circle cx="28" cy="80" r="8" fill="none" stroke="black" stroke-width="2"/>
</svg>`
  },
  {
    id: 'flame-sign',
    name: 'Placa Llama Plasma Artística',
    category: 'Decorativo',
    svg: `<svg viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Contorno de placa base -->
  <rect x="10" y="10" width="120" height="100" rx="8" fill="none" stroke="black" stroke-width="2"/>
  <!-- Silueta de llama central calada -->
  <path d="M 70 25 C 75 40 95 50 85 75 C 75 95 65 95 55 75 C 50 65 52 50 60 40 C 62 48 68 52 70 25 Z" fill="none" stroke="black" stroke-width="2"/>
  <!-- Taladros para colgar en pared -->
  <circle cx="22" cy="22" r="4" fill="none" stroke="black" stroke-width="2"/>
  <circle cx="118" cy="22" r="4" fill="none" stroke="black" stroke-width="2"/>
</svg>`
  },
  {
    id: 'gear-profile',
    name: 'Engranaje Piñón de 8 Dientes',
    category: 'Mecánica',
    svg: `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <!-- Perfil exterior de engranaje -->
  <path d="M 64 10 L 76 10 L 79 26 L 93 19 L 101 27 L 94 41 L 110 44 L 110 56 L 94 59 L 101 73 L 93 81 L 79 74 L 76 90 L 64 90 L 61 74 L 47 81 L 39 73 L 46 59 L 30 56 L 30 44 L 46 41 L 39 27 L 47 19 L 61 26 Z" fill="none" stroke="black" stroke-width="2" transform="translate(0, 20)"/>
  <!-- Agujero central para eje chavetado -->
  <circle cx="70" cy="70" r="14" fill="none" stroke="black" stroke-width="2"/>
</svg>`
  }
];
