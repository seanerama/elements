import { useEffect, useState } from 'react';
import { PaintBrushIcon } from '@phosphor-icons/react/dist/csr/PaintBrush';
import styles from './ThemeToggle.module.css';

const THEMES = [{ id: 'retro-science', label: 'Retro Science' }] as const;
type ThemeId = (typeof THEMES)[number]['id'];

const STORAGE_KEY = 'elements:theme';

function readTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  } catch {
    /* localStorage unavailable */
  }
  return 'retro-science';
}

function writeTheme(id: ThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* swallow */
  }
}

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>('retro-science');

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function pick(id: ThemeId) {
    setTheme(id);
    writeTheme(id);
    document.documentElement.setAttribute('data-theme', id);
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Switch theme"
      >
        <PaintBrushIcon weight="regular" aria-hidden />
        <span className="visually-hidden">Theme</span>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox">
          {THEMES.map((t) => (
            <li
              key={t.id}
              role="option"
              aria-selected={theme === t.id}
              data-active={theme === t.id ? 'true' : 'false'}
              className={styles.item}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(t.id);
              }}
            >
              {t.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
