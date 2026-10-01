import { useMemo } from 'react'
import { useActiveLayerIds, useLayers, useTimelineRange } from '@entities/layer'
import { useSeries } from '@entities/series'
import { buildChartData } from './buildChartData'

export function useChartData() {
  const { points } = useTimelineRange()
  const layers = useLayers()
  const activeLayerIds = useActiveLayerIds()
  const series = useSeries()

  return useMemo(
    () => buildChartData(points, layers, activeLayerIds, series),
    [points, layers, activeLayerIds, series],
  )
}
