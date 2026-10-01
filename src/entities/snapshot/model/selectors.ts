import { useAppStoreSelector } from '@shared/store/appStore'

export function useSnapshots() {
  return useAppStoreSelector(({ snapshot }) => snapshot)
}
