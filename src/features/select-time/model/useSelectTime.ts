import { useCallback } from 'react'
import { useTimelineRange } from '@entities/layer'
import { selectTime } from '@entities/time'
import { useAppStore } from '@shared/store/appStore'

export function useSelectTime() {
  const store = useAppStore()
  const { points } = useTimelineRange()

  return useCallback(
    (time: string) => {
      store.dispatch(({ time: state }) => ({ time: selectTime(state, points, time) }))
    },
    [store, points],
  )
}
