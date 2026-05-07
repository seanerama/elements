import { useEffect, useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import {
  createGame,
  answer,
  next as nextQuestion,
  isComplete,
  loadElementQuestions,
  type GameState,
} from '@/lib/trivia-engine';
import styles from './TriviaWidget.module.css';

interface Props {
  subjectSymbol: string;
  questionLimit?: number;
}

type Phase = 'loading' | 'asking' | 'revealed' | 'complete' | 'empty';

export default function TriviaWidget({ subjectSymbol, questionLimit = 5 }: Props) {
  const [state, setState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [selected, setSelected] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [correct, setCorrect] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await loadElementQuestions();
        if (cancelled) return;
        const game = createGame({
          mode: 'element',
          questionPool: all,
          shuffle: true,
          filterBySymbol: subjectSymbol,
          limit: questionLimit,
        });
        if (game.questions.length === 0) {
          setPhase('empty');
        } else {
          setState(game);
          setPhase('asking');
        }
      } catch {
        setPhase('empty');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectSymbol, questionLimit]);

  function handleAnswer(option: string) {
    if (!state || phase !== 'asking') return;
    const result = answer(state, option);
    setSelected(option);
    setCorrect(result.correct);
    setExplanation(result.explanation);
    setState(result.newState);
    setPhase('revealed');
  }

  function handleNext() {
    if (!state) return;
    const advanced = nextQuestion(state);
    setState(advanced);
    setSelected(null);
    setExplanation('');
    setCorrect(false);
    if (isComplete(advanced)) {
      setPhase('complete');
    } else {
      setPhase('asking');
    }
  }

  function restart() {
    setState((s) => {
      if (!s) return s;
      return { ...s, currentIndex: 0, score: 0, streak: 0, totalAnswered: 0, history: [] };
    });
    setPhase('asking');
    setSelected(null);
  }

  if (phase === 'loading') {
    return (
      <section className={styles.widget}>
        <p className={styles.eyebrow}>Test Yourself</p>
        <p className={styles.loadingText}>Loading…</p>
      </section>
    );
  }

  if (phase === 'empty' || !state) {
    return (
      <section className={styles.widget}>
        <p className={styles.eyebrow}>Test Yourself</p>
        <p className={styles.emptyText}>More questions coming soon.</p>
      </section>
    );
  }

  if (phase === 'complete') {
    return (
      <section className={styles.widget}>
        <p className={styles.eyebrow}>Test Yourself — Done</p>
        <p className={styles.completeText}>
          Score: <span className={styles.score}>{state.score}</span> / {state.questions.length}
        </p>
        <button type="button" className={styles.next} onClick={restart}>
          Play again
        </button>
      </section>
    );
  }

  const q = state.questions[state.currentIndex]!;
  const options = [...q.distractors, q.answer].sort();

  return (
    <section className={styles.widget}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Test Yourself</p>
        <p className={styles.score}>
          Score: {state.score}/{state.questions.length}
        </p>
      </header>

      <p className={styles.prompt}>{q.prompt}</p>

      {q.prompt_kind === 'image' && q.image_path && (
        <img src={q.image_path} alt="" className={styles.image} />
      )}

      <div className={styles.options}>
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isAnswer = opt === q.answer;
          let stateAttr = 'idle';
          if (phase === 'revealed') {
            if (isAnswer) stateAttr = 'correct';
            else if (isSelected) stateAttr = 'wrong';
            else stateAttr = 'dimmed';
          }
          return (
            <button
              key={opt}
              type="button"
              className={styles.option}
              data-state={stateAttr}
              onClick={() => handleAnswer(opt)}
              disabled={phase === 'revealed'}
            >
              <span className={styles.optionText}>{opt}</span>
              {phase === 'revealed' && isAnswer && (
                <CheckIcon weight="bold" className={styles.iconCorrect} aria-hidden />
              )}
              {phase === 'revealed' && isSelected && !isAnswer && (
                <XIcon weight="bold" className={styles.iconWrong} aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {phase === 'revealed' && (
        <div
          className={styles.feedback}
          role="status"
          aria-live="polite"
          data-correct={correct}
        >
          <p className={styles.feedbackHeader}>{correct ? 'Correct!' : 'Not quite.'}</p>
          <p className={styles.explanation}>{explanation}</p>
          <button type="button" className={styles.next} onClick={handleNext}>
            {state.currentIndex + 1 < state.questions.length ? 'Next question →' : 'See result'}
          </button>
        </div>
      )}
    </section>
  );
}
