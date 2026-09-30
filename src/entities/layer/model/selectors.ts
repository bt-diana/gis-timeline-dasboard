import { useAppStoreSelector } from '@shared/store/appStore'

export function useLayers() {
  return useAppStoreSelector(({ layer }) => layer.layers)
}

export function useActiveLayerIds() {
  return useAppStoreSelector(({ layer }) => layer.activeLayerIds)
}
