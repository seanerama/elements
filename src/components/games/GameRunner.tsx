import { useEffect, useState } from 'react';
import { LightningIcon } from '@phosphor-icons/react/dist/csr/Lightning';
import {
  createGame,
  answer,
  next as nextQuestion,
  isComplete,
  loadElementQuestions,
  loadCompoundQuestions,
  loadScores,
  saveScores,
  type GameMode,
  type GameState,
  type PersistedScore,
} from '@/lib/trivia-engine';
import type { Question } from '@/types/trivia';
import styles from './GameRunner.module.css';

interface Props {
  mode: GameMode;
  questionsPerRound?: number;
}

type Phase = 'loading' | 'asking' | 'revealed' | 'complete' | 'error';

const ROUND_DEFAULT = 10;

export default function GameRunner({ mode, questionsPerRound = ROUND_DEFAULT }: Props) {
  const [pool, setPool] = useState<Question[] | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [input, setInput] = useState('');
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [persisted, setPersisted] = useState<PersistedScore>(() => loadScores(mode));
  const [shake, setShake] = useState(false);
  const [showAnswer, setShowAnswer] = useState('');

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all =
          mode === 'element' ? await loadElementQuestions() : await loadCompoundQuestions();
        if (cancelled) return;
        setPool(all);
        startRound(all);
      } catch {
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function startRound(questionPool: Question[]) {
    const game = createGame({
      mode,
      questionPool,
      shuffle: true,
      limit: questionsPerRound,
    });
    setState(game);
    setPhase('asking');
    setInput('');
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!state || phase !== 'asking') return;
    const trimmed = input.trim();
    if (!trimmed) return;
    const result = answer(state, trimmed);
    setAnsweredCorrectly(result.correct);
    setExplanation(result.explanation);
    setShowAnswer(result.expected);
    setState(result.newState);
    setPhase('revealed');
    if (!result.correct) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  function advance() {
    if (!state) return;
    const advanced = nextQuestion(state);
    setState(advanced);
    setInput('');
    setExplanation('');
    setShowAnswer('');
    if (isComplete(advanced)) {
      setPhase('complete');
      // Persist new high water marks
      const updated: PersistedScore = {
        bestStreak: Math.max(persisted.bestStreak, advanced.bestStreak),
        highScore: Math.max(persisted.highScore, advanced.score),
        totalGames: persisted.totalGames + 1,
        totalCorrect: persisted.totalCorrect + advanced.score,
        totalAnswered: persisted.totalAnswered + advanced.totalAnswered,
        schema_version: '1.0.0',
      };
      saveScores(mode, updated);
      setPersisted(updated);
    } else {
      setPhase('asking');
    }
  }

  function playAgain() {
    if (!pool) return;
    startRound(pool);
  }

  if (phase === 'loading') return <p className={styles.loading}>Loading questions…</p>;
  if (phase === 'error') return <p className={styles.loading}>Could not load questions.</p>;
  if (!state) return null;

  if (phase === 'complete') {
    return (
      <section className={styles.stage}>
        <p className={styles.eyebrow}>Round complete</p>
        <p className={styles.bigScore}>
          {state.score} / {state.questions.length}
        </p>
        <dl className={styles.statsList}>
          <dt>Best streak (this round)</dt>
          <dd>{state.bestStreak}</dd>
          <dt>All-time high score</dt>
          <dd>{persisted.highScore}</dd>
          <dt>All-time best streak</dt>
          <dd>{persisted.bestStreak}</dd>
        </dl>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={playAgain}>
            Play again
          </button>
          <a href="/games" className={styles.secondaryLink}>
            ← Back to Games
          </a>
        </div>
      </section>
    );
  }

  const q = state.questions[state.currentIndex]!;
  const lightningCount = state.streak >= 3 ? 1 : 0;

  return (
    <section className={styles.stage}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {mode === 'element' ? 'Guess the Element' : 'Guess the Compound'}
        </p>
        <div className={styles.scoreboard}>
          <span className={styles.score}>
            <span className={styles.label}>Score</span> {state.score}
          </span>
          <span className={styles.streak} data-active={state.streak >= 3}>
            {lightningCount > 0 && (
              <LightningIcon weight="fill" className={styles.lightning} aria-hidden />
            )}
            <span className={styles.label}>Streak</span> {state.streak}
          </span>
        </div>
      </header>

      <div className={styles.cardWrap} data-shake={shake}>
        {q.prompt_kind === 'image' && q.image_path ? (
          <img src={q.image_path} alt="" className={styles.image} />
        ) : (
          <div className={styles.textCard}>
            <p className={styles.promptText}>{q.prompt}</p>
          </div>
        )}
      </div>

      {q.prompt_kind === 'image' && (
        <p className={styles.promptHint}>Identify this element from its photograph.</p>
      )}

      <form onSubmit={submit} className={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'element' ? 'Type symbol or name…' : 'Type formula or name…'}
          className={styles.input}
          disabled={phase !== 'asking'}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          aria-label="Your answer"
        />
        {phase === 'asking' && (
          <button type="submit" className={styles.primaryButton} disabled={!input.trim()}>
            Submit
          </button>
        )}
      </form>

      {phase === 'revealed' && (
        <div className={styles.feedback} data-correct={answeredCorrectly} role="status" aria-live="polite">
          <p className={styles.feedbackHeader}>
            {answeredCorrectly ? '✓ Correct!' : 'Wrong — answer was '}
            {!answeredCorrectly && <span className={styles.correctAnswer}>{showAnswer}</span>}
          </p>
          <p className={styles.explanation}>{explanation}</p>
          <button type="button" className={styles.primaryButton} onClick={advance}>
            {state.currentIndex + 1 < state.questions.length ? 'Next →' : 'See result'}
          </button>
        </div>
      )}

      <p className={styles.progress}>
        Question {state.currentIndex + 1} of {state.questions.length}
      </p>
    </section>
  );
}
