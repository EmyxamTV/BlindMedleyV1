import { Link } from '@adonisjs/inertia/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { InertiaProps } from '~/types'

type Choice = { id: number; title: string; artist: string }
type Question = { correctTrackId: number; previewUrl: string; choices: Choice[] }

export default function Practice(_: InertiaProps) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [answered, setAnswered] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(30)
  const [volume, setVolume] = useState(75)
  const startedAt = useRef(Date.now())
  const nextQuestionTimer = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const loadQuestion = useCallback(async () => {
    setQuestion(null)
    setAnswered(null)
    setFeedback(null)
    setError(null)
    try {
      const response = await fetch('/practice/question', { headers: { Accept: 'application/json' } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Impossible de charger un titre.')
      startedAt.current = Date.now()
      setQuestion(data as Question)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger un titre.')
    }
  }, [])

  useEffect(() => { void loadQuestion() }, [loadQuestion])

  useEffect(() => () => {
    if (nextQuestionTimer.current !== null) window.clearTimeout(nextQuestionTimer.current)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setPlaying(false)
    setPosition(0)
  }, [question])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume / 100
  }, [volume])

  function toggleAudio() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => setError('Impossible de lancer cet extrait audio.'))
    else audio.pause()
  }

  function answer(choice: Choice) {
    if (!question || answered !== null) return
    setAnswered(choice.id)
    const correct = choice.id === question.correctTrackId
    if (correct) {
      const earned = Math.max(100, 1_000 - Math.floor((Date.now() - startedAt.current) / 12))
      setScore((current) => current + earned)
      setStreak((current) => current + 1)
      setFeedback(`Bien joué ! +${earned} points`)
    } else {
      const solution = question.choices.find((item) => item.id === question.correctTrackId)
      setStreak(0)
      setFeedback(`Pas cette fois — c’était ${solution?.title} · ${solution?.artist}`)
    }
    nextQuestionTimer.current = window.setTimeout(() => void loadQuestion(), 1_800)
  }

  return (
    <div className="practice-page">
      <header className="practice-header">
        <div>
          <span className="eyebrow">MODE SOLO</span>
          <h1>Échauffement musical</h1>
          <p>Un extrait, quatre réponses. Enchaîne les titres à ton rythme.</p>
        </div>
        <Link route="game.index" className="btn btn-ghost">Parties multijoueur</Link>
      </header>

      <section className="practice-board">
        <aside className="practice-stats">
          <div><span>Score</span><strong>{score.toLocaleString('fr-FR')}</strong></div>
          <div><span>Série</span><strong>{streak > 0 ? `×${streak}` : '—'}</strong></div>
        </aside>

        <main className="practice-question">
          {error ? (
            <div className="practice-empty"><p>{error}</p><button className="btn btn-primary" onClick={() => void loadQuestion()}>Réessayer</button></div>
          ) : !question ? (
            <div className="practice-empty"><div className="spinner-large" /><p>Préparation de l’extrait…</p></div>
          ) : (
            <>
              <div className="practice-audio player-practice">
                <audio
                  ref={audioRef}
                  src={question.previewUrl}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => { setPlaying(false); setPosition(0) }}
                  onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 30)}
                  onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
                />
                <button type="button" className="practice-play" onClick={toggleAudio} aria-label={playing ? 'Mettre en pause' : 'Démarrer l extrait'}>
                  {playing ? 'Ⅱ' : '▶'}
                </button>
                <div className="practice-player-info">
                  <strong>{playing ? 'Extrait en cours' : 'Prêt à écouter'}</strong>
                  <span>Quel est ce morceau ?</span>
                  <div className="practice-progress"><i style={{ width: `${Math.min(100, (position / duration) * 100)}%` }} /></div>
                </div>
                <label className="practice-volume">
                  <span>🔊</span>
                  <input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
                </label>
              </div>
              <div className="choices-grid practice-choices">
                {question.choices.map((choice) => {
                  const isCorrect = answered !== null && choice.id === question.correctTrackId
                  const isWrong = answered === choice.id && !isCorrect
                  return <button key={choice.id} className={`choice-btn ${isCorrect ? 'practice-correct' : ''} ${isWrong ? 'practice-wrong' : ''}`} disabled={answered !== null} onClick={() => answer(choice)}><span className="choice-title">{choice.title}</span><span className="choice-artist">{choice.artist}</span></button>
                })}
              </div>
              {feedback && <div className={`practice-feedback ${answered === question.correctTrackId ? 'correct' : 'incorrect'}`}>{feedback}</div>}
              {answered !== null && <button className="btn btn-primary practice-next" onClick={() => void loadQuestion()}>Titre suivant →</button>}
            </>
          )}
        </main>
      </section>
    </div>
  )
}
