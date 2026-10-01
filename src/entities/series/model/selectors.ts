import { useAppStoreSelector } from '@shared/store/appStore'

export function useSeries() {
  return useAppStoreSelector(({ series }) => series)
}
