import { useEffect, useState } from 'react';
import type { Element } from '@/types/element';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/category-labels';
import styles from './GroupFilter.module.css';

interface Props {
  /** Initial value, optionally read from URL ?filter=... */
  initialFilter?: Element['category'] | null;
}

export default function GroupFilter({ initialFilter = null }: Props) {
  const [active, setActive] = useState<Element['category'] | null>(initialFilter);

  useEffect(() => {
    const grid = document.querySelector<HTMLElement>('[data-grid]');
    if (!grid) return;
    grid.dataset.filterActive = active ? 'true' : 'false';
    grid.querySelectorAll<HTMLAnchorElement>('a.cell').forEach((cell) => {
      const cat = cell.dataset.category;
      cell.dataset.cellMatch = active && cat === active ? 'true' : 'false';
    });

    // Reflect in URL without reload
    const url = new URL(window.location.href);
    if (active) url.searchParams.set('filter', active);
    else url.searchParams.delete('filter');
    window.history.replaceState({}, '', url.toString());
  }, [active]);

  function toggle(cat: Element['category']) {
    setActive((prev) => (prev === cat ? null : cat));
  }

  return (
    <div className={styles.row} role="toolbar" aria-label="Filter by category">
      {CATEGORY_ORDER.map((cat) => (
        <button
          key={cat}
          type="button"
          aria-pressed={active === cat}
          data-active={active === cat ? 'true' : 'false'}
          data-category={cat}
          className={styles.chip}
          style={{ '--chip-color': `var(--color-cat-${cat})` } as React.CSSProperties}
          onClick={() => toggle(cat)}
        >
          <span className={styles.dot} aria-hidden />
          <span>{CATEGORY_LABELS[cat]}</span>
        </button>
      ))}
      {active && (
        <button type="button" className={styles.clear} onClick={() => setActive(null)}>
          Clear
        </button>
      )}
    </div>
  );
}
