import { useCallback } from 'react'
import { snapshotRetried } from '@entities/snapshot'
import { useAppStore } from '@shared/store/appStore'

export function useRetrySnapshot() {
  const store = useAppStore()

  return useCallback(
    (layerId: string) => {
      store.dispatch(({ snapshot }) => ({ snapshot: snapshotRetried(snapshot, layerId) }))
    },
    [store],
  )
}
