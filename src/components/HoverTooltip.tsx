import { useEffect, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';
import { CATEGORY_LABELS } from '@/lib/category-labels';
import type { Element } from '@/types/element';
import styles from './HoverTooltip.module.css';

interface CellSummary {
  symbol: string;
  name: string;
  atomic_number: number;
  atomic_mass: number;
  category: Element['category'];
  phase_at_stp: Element['phase_at_stp'];
}

interface Props {
  /** All elements, slimmed for tooltip use. */
  summaries: CellSummary[];
}

interface HoverState {
  cell: HTMLElement;
  data: CellSummary;
}

export default function HoverTooltip({ summaries }: Props) {
  const [state, setState] = useState<HoverState | null>(null);
  const bySymbol = new Map(summaries.map((s) => [s.symbol, s]));

  useEffect(() => {
    function onEnter(e: Event) {
      const target = e.target as HTMLElement | null;
      const cell = target?.closest<HTMLAnchorElement>('a.cell');
      if (!cell) return;
      const sym = cell.dataset.symbol;
      if (!sym) return;
      const data = bySymbol.get(sym);
      if (!data) return;
      setState({ cell, data });
    }
    function onLeave(e: Event) {
      const cell = (e.target as HTMLElement | null)?.closest('a.cell');
      if (!cell) return;
      setState((cur) => (cur && cur.cell === cell ? null : cur));
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setState(null);
    }
    const grid = document.querySelector('[data-grid]');
    grid?.addEventListener('mouseover', onEnter);
    grid?.addEventListener('mouseout', onLeave);
    grid?.addEventListener('focusin', onEnter);
    grid?.addEventListener('focusout', onLeave);
    document.addEventListener('keydown', onEsc);
    return () => {
      grid?.removeEventListener('mouseover', onEnter);
      grid?.removeEventListener('mouseout', onLeave);
      grid?.removeEventListener('focusin', onEnter);
      grid?.removeEventListener('focusout', onLeave);
      document.removeEventListener('keydown', onEsc);
    };
  }, [bySymbol]);

  const { refs, floatingStyles, context } = useFloating({
    open: state !== null,
    onOpenChange: (open) => {
      if (!open) setState(null);
    },
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    elements: { reference: state?.cell },
  });

  const hover = useHover(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([hover, focus, dismiss]);

  if (!state) return null;
  const { data } = state;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        role="tooltip"
        className={styles.tooltip}
        style={floatingStyles}
        {...getFloatingProps()}
      >
        <div className={styles.head}>
          <span className={styles.name}>{data.name}</span>
          <span className={styles.num}>{data.atomic_number}</span>
        </div>
        <dl className={styles.list}>
          <dt>Symbol</dt>
          <dd className={styles.mono}>{data.symbol}</dd>
          <dt>Mass</dt>
          <dd className={styles.mono}>{data.atomic_mass.toFixed(3)} u</dd>
          <dt>Category</dt>
          <dd>{CATEGORY_LABELS[data.category]}</dd>
          <dt>Phase</dt>
          <dd>
            {data.phase_at_stp === 'unknown'
              ? 'unknown (synthetic)'
              : `${data.phase_at_stp} at STP`}
          </dd>
        </dl>
      </div>
    </FloatingPortal>
  );
}
