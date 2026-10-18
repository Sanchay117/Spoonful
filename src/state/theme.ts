import type { Energy } from './tasks';

export interface BlobSpec {
  size: number;
  x: string;
  y: string;
  blur: number;
  opacity: number;
  dx: number;
  dy: number;
  ds: number;
  period: number;
}

export const BLOBS: BlobSpec[] = [
  { size: 640, x: '-10%', y: '-14%', blur: 72, opacity: 0.9, dx: 70, dy: 44, ds: 1.07, period: 28 },
  { size: 560, x: '58%', y: '-10%', blur: 84, opacity: 0.85, dx: -56, dy: 62, ds: 1.1, period: 34 },
  { size: 520, x: '66%', y: '52%', blur: 96, opacity: 0.8, dx: -74, dy: -46, ds: 0.94, period: 26 },
  { size: 600, x: '-12%', y: '56%', blur: 92, opacity: 0.85, dx: 58, dy: -66, ds: 1.08, period: 31 },
  { size: 440, x: '32%', y: '34%', blur: 105, opacity: 0.55, dx: -44, dy: 52, ds: 1.12, period: 38 },
];

export interface Palette {
  bg: string;
  scrim: string;
  dim: number;
  colors: string[];
}

export const PALETTES: Record<Energy, Palette> = {
  good: {
    bg: '#fff6ea',
    scrim: 'linear-gradient(180deg, rgba(255, 246, 234, 0.55), rgba(255, 246, 234, 0.3))',
    dim: 1,
    colors: ['#ffd1a8', '#ffe6a3', '#ff9f80', '#ffd9c2', '#fde2b4'],
  },
  okay: {
    bg: '#f4f2fb',
    scrim: 'linear-gradient(180deg, rgba(244, 242, 251, 0.55), rgba(244, 242, 251, 0.3))',
    dim: 1,
    colors: ['#d9ccff', '#b9d3ff', '#e6dcff', '#cfe4ff', '#cbbef2'],
  },
  low: {
    bg: '#221f3e',
    scrim: 'linear-gradient(180deg, rgba(22, 19, 42, 0.52), rgba(22, 19, 42, 0.3))',
    dim: 0.92,
    colors: ['#3b3570', '#53386b', '#2b2856', '#4e3060', '#5e4478'],
  },
};
