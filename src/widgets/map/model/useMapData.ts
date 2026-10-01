import { useMemo } from 'react'
import { useActiveLayerIds, useLayers } from '@entities/layer'
import { useSnapshots } from '@entities/snapshot'
import { formatLocalTime, useSelectedTime } from '@entities/time'
import { buildMapLayers, isLoading } from './buildMapLayers'

export function useMapData() {
  const layers = useLayers()
  const activeLayerIds = useActiveLayerIds()
  const snapshots = useSnapshots()
  const selectedTime = useSelectedTime()

  const mapLayers = useMemo(() => buildMapLayers(layers, activeLayerIds, snapshots), [layers, activeLayerIds, snapshots])
  const loading = isLoading(activeLayerIds, snapshots)

  return { layers: mapLayers, loadingTime: loading && selectedTime !== null ? formatLocalTime(selectedTime) : null }
}
