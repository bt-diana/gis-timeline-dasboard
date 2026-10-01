import { useAppStoreSelector } from '@shared/store/appStore'

export function useSelectedTime() {
  return useAppStoreSelector(({ time }) => time.selectedTime)
}
