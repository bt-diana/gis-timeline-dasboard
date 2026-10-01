import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { loadSucceeded } from '@entities/layer'
import { useSelectedTime } from '@entities/time'
import { AppStoreProvider, initialAppStoreState, useAppStore } from '@shared/store/appStore'
import { TEST_LAYERS } from '@shared/test/layers'
import { useInitialSelectedTime } from './useInitialSelectedTime'
import { useSelectTime } from './useSelectTime'

const nearestMock = vi.hoisted(() => vi.fn<(points: readonly string[], now: Date) => string | null>())

vi.mock('@entities/time/model/localTime', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  nearestByTimeOfDay: nearestMock,
}))
const RANGE_POINTS = ['2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z']
const NEAREST_POINT = '2026-01-01T11:00:00Z'
const OTHER_POINT = '2026-01-01T12:00:00Z'

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider state={initialAppStoreState}>{children}</AppStoreProvider>
}

function renderInitialTime() {
  const view = renderHook(
    () => {
      const selectedTime = useSelectedTime()
      const store = useAppStore()
      useInitialSelectedTime()
      return { selectedTime, store, selectTime: useSelectTime() }
    },
    { wrapper },
  )
  const loadLayers = () => {
    act(() => {
      view.result.current.store.dispatch(({ layer }) => ({ layer: loadSucceeded(layer, [...TEST_LAYERS]) }))
    })
  }
  return { ...view, loadLayers }
}

beforeEach(() => {
  nearestMock.mockReturnValue(NEAREST_POINT)
})

afterEach(() => {
  nearestMock.mockReset()
})

describe('useInitialSelectedTime', () => {
  it('leaves the time unset while the range is empty, then sets the nearest point to the range and now once it loads', () => {
    const { result, loadLayers } = renderInitialTime()

    expect(result.current.selectedTime).toBeNull()

    loadLayers()

    expect(nearestMock).toHaveBeenLastCalledWith(RANGE_POINTS, expect.any(Date))
    expect(result.current.selectedTime).toBe(NEAREST_POINT)
  })

  it('does not override a time selected later, even when the range changes', () => {
    const { result, loadLayers } = renderInitialTime()
    loadLayers()

    act(() => {
      result.current.selectTime(OTHER_POINT)
    })
    expect(result.current.selectedTime).toBe(OTHER_POINT)

    loadLayers()

    expect(result.current.selectedTime).toBe(OTHER_POINT)
  })
})
