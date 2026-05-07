import { useEffect, useState } from 'react';
import { loadScores, type GameMode, type PersistedScore } from '@/lib/trivia-engine';

interface Props {
  mode: GameMode;
  href: string;
  title: string;
  description: string;
}

const SENTINEL: PersistedScore = {
  bestStreak: 0,
  highScore: 0,
  totalGames: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  schema_version: '1.0.0',
};

export default function HighScoreCard({ mode, href, title, description }: Props) {
  const [score, setScore] = useState<PersistedScore>(SENTINEL);

  useEffect(() => {
    setScore(loadScores(mode));
  }, [mode]);

  const hasPlayed = score.totalGames > 0;

  return (
    <a className="game-card" href={href} data-testid={`gamecard-${mode}`}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <dl>
        <dt>Best streak</dt>
        <dd className="mono">{hasPlayed ? score.bestStreak : '—'}</dd>
        <dt>High score</dt>
        <dd className="mono">{hasPlayed ? score.highScore : '—'}</dd>
        <dt>Played</dt>
        <dd className="mono">{score.totalGames}</dd>
      </dl>
      <span className="cta">Play →</span>
    </a>
  );
}
