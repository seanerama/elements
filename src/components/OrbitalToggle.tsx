import { lazy, Suspense, useState } from 'react';
import { CubeIcon } from '@phosphor-icons/react/dist/csr/Cube';
import styles from './OrbitalToggle.module.css';

interface Props {
  electronsPerShell: number[];
  protons: number;
  neutrons: number | null;
}

// Lazy-loaded — Three.js bundle only fetched on toggle click.
const Atom = lazy(() => import('./orbital-viz/Atom'));

export default function OrbitalToggle({ electronsPerShell, protons, neutrons }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="orbital-viz"
        onClick={() => setOpen((o) => !o)}
        data-testid="orbital-toggle"
      >
        <CubeIcon weight="regular" aria-hidden />
        <span>{open ? 'Hide 3D orbital' : 'View 3D orbital'}</span>
        <span className={styles.chev} aria-hidden>
          {open ? '▼' : '▶'}
        </span>
      </button>

      {open && (
        <div id="orbital-viz" className={styles.panel} role="region" aria-label="3D orbital viz">
          <Suspense
            fallback={<div className={styles.loading}>Rendering…</div>}
          >
            <Atom
              electronsPerShell={electronsPerShell}
              protons={protons}
              neutrons={neutrons}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
