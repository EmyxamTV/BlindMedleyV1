import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'admin/dashboard': ExtractProps<(typeof import('../../inertia/pages/admin/dashboard.tsx'))['default']>
    'admin/playlists': ExtractProps<(typeof import('../../inertia/pages/admin/playlists.tsx'))['default']>
    'admin/users': ExtractProps<(typeof import('../../inertia/pages/admin/users.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'bandle': ExtractProps<(typeof import('../../inertia/pages/bandle.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'game/index': ExtractProps<(typeof import('../../inertia/pages/game/index.tsx'))['default']>
    'game/lobby': ExtractProps<(typeof import('../../inertia/pages/game/lobby.tsx'))['default']>
    'game/play': ExtractProps<(typeof import('../../inertia/pages/game/play.tsx'))['default']>
    'game/results': ExtractProps<(typeof import('../../inertia/pages/game/results.tsx'))['default']>
    'game/wizard': ExtractProps<(typeof import('../../inertia/pages/game/wizard.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'leaderboard': ExtractProps<(typeof import('../../inertia/pages/leaderboard.tsx'))['default']>
    'playlists/create': ExtractProps<(typeof import('../../inertia/pages/playlists/create.tsx'))['default']>
    'playlists/edit': ExtractProps<(typeof import('../../inertia/pages/playlists/edit.tsx'))['default']>
    'playlists/index': ExtractProps<(typeof import('../../inertia/pages/playlists/index.tsx'))['default']>
    'practice': ExtractProps<(typeof import('../../inertia/pages/practice.tsx'))['default']>
    'profile': ExtractProps<(typeof import('../../inertia/pages/profile.tsx'))['default']>
  }
}
