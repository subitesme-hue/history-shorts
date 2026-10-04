import '@fontsource/dm-serif-display/400.css';
import '@fontsource/dm-serif-display/400-italic.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import type {FBrand} from './types';

// Editorial-futurism look: ivory paper, navy type, gold linework.
// References: Vignelli grid discipline, Saul Bass reveals, Art-Deco sunburst / orbit linework.
export const DISPLAY = "'DM Serif Display', serif";
export const GROTESK = "'Space Grotesk', sans-serif";

export const FUTURE_BRAND: FBrand = {
  name: 'T&I NEWS',
  url: 'tai.news',
  series: 'FUTURE SHIFT',
  bg: '#F7F2E6',
  bg2: '#EADFC6',
  accent: '#B07F22',
  accentSoft: '#D8B565',
  text: '#0B1F44',
};

// "#RRGGBB" + alpha -> rgba()
export const a = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// Content lives between y=200 and y=1200. Captions own 1250-1560. Platform UI sits below that.
export const SAFE_TOP = 230;
export const CAPTION_TOP = 1270;
