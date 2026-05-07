import { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { buildSearchIndex, searchEntries, type SearchEntry } from '@/lib/search';
import styles from './SearchBox.module.css';

interface Props {
  entries: SearchEntry[];
}

export default function SearchBox({ entries }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => buildSearchIndex(entries), [entries]);
  const results = useMemo(() => (q ? searchEntries(index, q, 8) : []), [index, q]);

  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function go(entry: SearchEntry) {
    window.location.href = `/elements/${entry.symbol.toLowerCase()}`;
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const target = results[activeIdx] ?? results[0];
      if (target) go(target);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.field}>
        <MagnifyingGlassIcon aria-hidden weight="regular" className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="search-results"
          aria-autocomplete="list"
          placeholder="Search elements…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          className={styles.input}
        />
      </div>
      {open && results.length > 0 && (
        <ul id="search-results" role="listbox" className={styles.list}>
          {results.map((r, i) => (
            <li
              key={r.symbol}
              role="option"
              aria-selected={i === activeIdx}
              data-active={i === activeIdx ? 'true' : 'false'}
              className={styles.item}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                go(r);
              }}
            >
              <span className={styles.itemSym}>{r.symbol}</span>
              <span className={styles.itemName}>{r.name}</span>
              <span className={styles.itemNum}>{r.atomic_number}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
