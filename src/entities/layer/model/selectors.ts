import { useMemo } from 'react'
import { useAppStoreSelector } from '@shared/store/appStore'
import { timelineRange } from './timelineRange'

export function useLayers() {
  return useAppStoreSelector(({ layer }) => layer.layers)
}

export function useActiveLayerIds() {
  return useAppStoreSelector(({ layer }) => layer.activeLayerIds)
}

export function useLayerList() {
  return useAppStoreSelector(({ layer }) => layer.list)
}

export function useTimelineRange() {
  const layers = useLayers()
  return useMemo(() => timelineRange(layers), [layers])
}
