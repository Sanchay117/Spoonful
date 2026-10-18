import { motion } from 'framer-motion';
import type { Energy } from '../state/tasks';
import { BLOBS, PALETTES } from '../state/theme';

export function Aura({ energy, ambient }: { energy: Energy; ambient: boolean }) {
  const palette = PALETTES[energy];
  return (
    <div data-aura data-ambient={ambient ? 'on' : 'off'} aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ backgroundColor: palette.bg }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: b.size, height: b.size, left: b.x, top: b.y, filter: `blur(${b.blur}px)` }}
          initial={false}
          animate={
            ambient
              ? { backgroundColor: palette.colors[i], opacity: b.opacity * palette.dim, x: b.dx, y: b.dy, scale: b.ds }
              : { backgroundColor: palette.colors[i], opacity: b.opacity * palette.dim, x: 0, y: 0, scale: 1 }
          }
          transition={{
            backgroundColor: { duration: 1.2, ease: 'easeInOut' },
            opacity: { duration: 1.2, ease: 'easeInOut' },
            default: ambient
              ? { duration: b.period, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
              : { duration: 1.2, ease: 'easeInOut' },
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: palette.scrim }} />
    </div>
  );
}
