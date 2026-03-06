import { useState } from 'react'
import { router } from '@inertiajs/react'
import type { InertiaProps } from '~/types'

interface Entry {
  rank: number
  userId: number
  username: string
  avatarUrl: string | null
  level: number
  score: number
  country: string | null
}

interface Props extends InertiaProps {
  period: 'global' | 'weekly' | 'monthly'
  country: string | null
  entries: Entry[]
  myRank: number | null
  friendsLeaderboard: Entry[]
}

const PERIODS = [
  { key: 'global',  label: 'Global' },
  { key: 'weekly',  label: 'Cette semaine' },
  { key: 'monthly', label: 'Ce mois' },
] as const

function EntryRow({ entry, isMe }: { entry: Entry; isMe: boolean }) {
  const isTop3 = entry.rank <= 3
  const rankDisplay =
    entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`

  return (
    <div className={`lb-row ${isMe ? 'me' : ''}`}>
      <span className={`lb-rank ${isTop3 ? 'top' : ''}`}>{rankDisplay}</span>
      <div className="lb-player">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="lb-av" />
        ) : (
          <div className="lb-av-ph">{entry.username[0].toUpperCase()}</div>
        )}
        <div>
          <span className="lb-username">{entry.username}</span>
          {entry.country && <span className="lb-country">{entry.country}</span>}
        </div>
      </div>
      <span className="lb-level">Niv. {entry.level}</span>
      <span className="lb-score">{entry.score.toLocaleString()} pts</span>
    </div>
  )
}

export default function Leaderboard({ period, country, entries, myRank, friendsLeaderboard, user }: Props) {
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global')

  function changePeriod(p: string) {
    router.get('/leaderboard', { period: p, country: country ?? undefined })
  }

  return (
    <div className="leaderboard-page">
      <div className="lb-topbar">
        <h1>Classement</h1>
        {myRank && (
          <div className="my-rank-chip">
            Votre rang : <strong>#{myRank}</strong>
          </div>
        )}
      </div>

      <div className="lb-controls">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Général
          </button>
          <button
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Amis
          </button>
        </div>

        {activeTab === 'global' && (
          <div className="periods">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`period-btn ${period === p.key ? 'active' : ''}`}
                onClick={() => changePeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lb-list">
        {activeTab === 'global' &&
          (entries.length === 0 ? (
            <p className="empty-state">Aucun score enregistré pour cette période.</p>
          ) : (
            entries.map((e) => <EntryRow key={e.userId} entry={e} isMe={e.userId === user?.id} />)
          ))}

        {activeTab === 'friends' &&
          (friendsLeaderboard.length === 0 ? (
            <p className="empty-state">Pas encore d'amis dans le classement.</p>
          ) : (
            friendsLeaderboard.map((e) => (
              <EntryRow key={e.userId} entry={e} isMe={e.userId === user?.id} />
            ))
          ))}
      </div>
    </div>
  )
}
