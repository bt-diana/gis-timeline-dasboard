import { useEffect } from 'react'
import { useTimelineRange } from '@entities/layer'
import { initSelectedTime } from '@entities/time'
import { useAppStore } from '@shared/store/appStore'

export function useInitialSelectedTime() {
  const store = useAppStore()
  const { points } = useTimelineRange()

  useEffect(() => {
    store.dispatch(({ time }) => ({ time: initSelectedTime(time, points, new Date()) }))
  }, [store, points])
}
